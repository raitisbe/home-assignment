import { Grid, IconButton, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { Component, useEffect, useLayoutEffect, useState } from "react";
import { Subject, takeUntil } from "rxjs";
import update from "immutability-helper";

import { Block } from "./block";
import { BlockModel } from "./block.model";
import { socketService } from "../sockets";
import { useNavigate } from "react-router-dom";

export function Chat() {
  let messagesEnd: HTMLDivElement | null = null;
  const [blocks, setBlocks] = useState([] as BlockModel[]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    scrollToBottom();
  }, [blocks]);
  const navigate = useNavigate();

  useEffect(() => {
    const onCloseSubscription = socketService.onClose.subscribe(() => {
      navigate("/", {
        state: { errorOpen: true, message: "You were disconnected" },
      });
    });

    const onMessageSubscription = socketService.onMessage.subscribe((e) => {
      const lastBlock =
        blocks.length > 0 ? blocks[blocks.length - 1] : undefined;
      let append = false;
      if (lastBlock?.sender === e.sender) {
        append = true;
      }
      if (append) {
        appendMessageToBlock(e);
      } else {
        startNewBlock(e);
      }
    });
    return () => {
      onCloseSubscription.unsubscribe();
      onMessageSubscription.unsubscribe();
    };
  }, [blocks]);

  function startNewBlock(msg: { sender: string; text: string; date: string }) {
    const newBlock = {
      sender: msg.sender,
      messages: [{ text: msg.text, date: msg.date }],
    };
    setBlocks((previousState) => [...previousState, newBlock]);
  }

  function appendMessageToBlock(e: {
    sender: string;
    text: string;
    date: string;
  }) {
    const lastBlock = blocks[blocks.length - 1];
    //Append message and recreate the whole last block
    const recreatedBlock = update(lastBlock, {
      messages: {
        $apply: function () {
          return update(lastBlock.messages, {
            $push: [{ text: e.text, date: e.date }],
          });
        },
      },
    });
    const nextBlocks = blocks.map((c, i) => {
      if (i === blocks.length - 1) {
        return recreatedBlock;
      } else {
        return c;
      }
    });

    setBlocks(nextBlocks);
  }

  function scrollToBottom() {
    messagesEnd?.scrollIntoView({ behavior: "smooth" });
  }

  function send() {
    socketService.send(draft);
    setDraft("");
  }

  return (
    <div>
      <Grid
        container
        justifyContent={"center"}
        sx={{ height: "calc(100vh - 4em)" }}
        spacing={1}
      >
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            overflowY: "scroll",
            flexGrow: 1,
            maxHeight: "calc(100vh - 6em)",
          }}
        >
          {blocks.map((block, i) => {
            return <Block key={i} data={block} index={i}></Block>;
          })}
          <div
            style={{ float: "left", clear: "both" }}
            ref={(el) => {
              messagesEnd = el;
            }}
          ></div>
        </Grid>
        <Grid item xs={12} md={8} sx={{ height: "2em" }}>
          <TextField
            label="Message:"
            variant="outlined"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            fullWidth
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                send();
              }
            }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={send}>
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}
