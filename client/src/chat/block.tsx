import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Fragment, ReactNode } from "react";

import { BlockModel } from "./block.model";

/**
 * Messages coming from one sender are grouped into blocks
 * @param props
 * @returns
 */
export function Block(props: { index: number; data: BlockModel }) {
  /**
   * Get the first letter of sender to display in the chip
   * @param sender
   * @returns
   */
  function firstLetter(sender: string): ReactNode {
    if (sender && sender.length > 0) {
      return sender[0].toUpperCase();
    }
  }

  return (
    <Card sx={{ margin: "1em", backgroundColor: "#edebe1" }}>
      <CardHeader
        sx={{
          padding: "0.5em",
          textAlign: props.index % 2 === 0 ? "left" : "right",
          direction: props.index % 2 === 0 ? "ltl" : "rtl",
        }}
        avatar={<Avatar sx={{marginLeft: '0.5em'}}>{firstLetter(props.data.sender)}</Avatar>}
        title={props.data.sender}
        subheader={props.data.messages[0].date}
      />
      <CardContent
        sx={{
          padding: "0.5em",
          textAlign: props.index % 2 === 0 ? "left" : "right",
        }}
      >
        <List dense={true}>
          {props.data.messages.map((msg, i) => {
            return (
              <ListItem sx={{ borderBottom: "1px solid #CCC" }}>
                <ListItemText
                  sx={{ textAlign: props.index % 2 === 0 ? "left" : "right" }}
                  primary={<Fragment>{msg.text}</Fragment>}
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}
