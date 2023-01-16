import { Grid, IconButton, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { Component } from "react";
import { Subject, takeUntil } from "rxjs";
import update from "immutability-helper";

import { Block } from "./block";
import { BlockModel } from "./block.model";
import { socketService } from "../sockets";

interface Props {
  navigate: any;
}

interface StateModel {
  blocks: BlockModel[];
  draft: string;
}

export class Chat extends Component<Props, StateModel> {
  end = new Subject<void>();
  messagesEnd: HTMLDivElement | null = null;

  constructor(props: Props | Readonly<Props>) {
    super(props);

    this.state = {
      blocks: [],
      draft: "",
    };

    this.send = this.send.bind(this);
    this.onDraftChange = this.onDraftChange.bind(this);
  }

  componentDidMount() {
    socketService.onClose.pipe(takeUntil(this.end)).subscribe(() => {
      this.props.navigate("/", {
        state: { errorOpen: true, message: "You were disconnected" },
      });
    });

    socketService.onMessage.pipe(takeUntil(this.end)).subscribe((e) => {
      const lastBlock =
        this.state.blocks.length > 0
          ? this.state.blocks[this.state.blocks.length - 1]
          : undefined;
      let append = false;
      if (lastBlock?.sender === e.sender) {
        append = true;
      }
      if (append) {
        this.appendMessageToBlock(e);
      } else {
        this.startNewBlock(e);
      }
    });
  }

  startNewBlock(msg: { sender: string; text: string }) {
    const newBlock = {
      sender: msg.sender,
      messages: [{ text: msg.text }],
    };
    this.setState(
      (previousState) => ({
        blocks: [...previousState.blocks, newBlock],
      }),
      () => this.scrollToBottom()
    );
  }

  appendMessageToBlock(e: { sender: string; text: string }) {
    this.setState(
      (previousState) => {
        const prevStateLastBlock =
          previousState.blocks[previousState.blocks.length - 1];
        //Append message and recreate the whole last block
        const recreatedBlock = update(prevStateLastBlock, {
          messages: {
            $apply: function () {
              return update(prevStateLastBlock.messages, {
                $push: [{ text: e.text }],
              });
            },
          },
        });
        //Duplicate blocks array with newly recreated last block
        return update(previousState, {
          blocks: {
            [previousState.blocks.length - 1]: { $set: recreatedBlock },
          },
        });
      },
      () => this.scrollToBottom()
    );
  }

  scrollToBottom() {
    this.messagesEnd?.scrollIntoView({ behavior: "smooth" });
  }

  componentWillUnmount() {
    this.end.next();
  }

  onDraftChange(event: { target: { value: string } }) {
    this.setState({ draft: event.target.value });
  }

  send() {
    socketService.send(this.state.draft);
    this.setState({ draft: "" });
  }

  render() {
    return (
      <div>
        <Grid
          container
          justifyContent={"center"}
          sx={{ height: "calc(100vh - 4em)" }}
          spacing={0}
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
            {this.state.blocks.map((block, i) => {
              return <Block key={i} data={block} index={i}></Block>;
            })}
            <div
              style={{ float: "left", clear: "both" }}
              ref={(el) => {
                this.messagesEnd = el;
              }}
            ></div>
          </Grid>
          <Grid item xs={12} md={8} sx={{ height: "2em" }}>
            <TextField
              label="Message:"
              variant="outlined"
              value={this.state.draft}
              onChange={this.onDraftChange}
              fullWidth
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  this.send();
                }
              }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={this.send}>
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
}
