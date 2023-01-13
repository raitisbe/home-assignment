import { Grid, IconButton, TextField } from "@mui/material";
import { Block } from "./block";
import { BlockModel } from "./block.model";
import SendIcon from "@mui/icons-material/Send";
import { socketService } from "../sockets";
import { Component } from "react";
import { Subject, takeUntil } from "rxjs";
import update from "immutability-helper";

interface Props {
  navigate: any;
}

interface StateModel {
  blocks: BlockModel[];
}

export class Chat extends Component<Props, StateModel> {
  draft: string = "";
  end = new Subject<void>();

  constructor(props: Props | Readonly<Props>) {
    super(props);

    this.state = {
      blocks: [],
    };

    this.send = this.send.bind(this);
    this.onDraftChange = this.onDraftChange.bind(this);
  }

  componentDidMount() {
    socketService.onClose.pipe(takeUntil(this.end)).subscribe(() => {
      this.props.navigate("/");
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
        this.setState((previousState) => {
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
        });
      } else {
        const newBlock = {
          sender: e.sender,
          messages: [{ text: e.text }],
        };
        this.setState((previousState) => ({
          blocks: [...previousState.blocks, newBlock],
        }));
      }
    });
  }

  componentWillUnmount() {
    this.end.next();
  }

  onDraftChange(event: { target: { value: string } }) {
    this.draft = event.target.value;
  }

  send() {
    socketService.send(this.draft);
  }

  render() {
    return (
      <div>
        <Grid container justifyContent={"center"} spacing={2}>
          <Grid item xs={12} md={8}>
            {this.state.blocks.map((block, i) => {
              return <Block key={i} data={block}></Block>;
            })}
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              label="Message:"
              variant="outlined"
              onChange={this.onDraftChange}
              fullWidth
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
