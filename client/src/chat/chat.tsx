import { Grid, IconButton, TextField } from "@mui/material";
import { Block } from "./block";
import { BlockModel } from "./block.model";
import SendIcon from "@mui/icons-material/Send";
import { socketService } from "../sockets";
import { Component } from "react";
import { Subject, takeUntil } from "rxjs";

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
      const newItem = {
        sender: e.sender,
        messages: [{ id: Math.random().toString(), text: e.text }],
      };
      this.setState((previousState) => ({
        blocks: [...previousState.blocks, newItem],
      }));
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
