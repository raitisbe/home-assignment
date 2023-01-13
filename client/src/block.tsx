import { Avatar, Chip, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ReactNode } from 'react';
import { BlockDataModel } from './BlockDataModel';

const Message = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#d9e3f7',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  margin: theme.spacing(0.5),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

/**
 * Messages coming from one sender are grouped into blocks
 * @param props 
 * @returns 
 */
export function Block(props: { data: BlockDataModel; }) {
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
    <Grid container spacing={2}>
      <Grid item xs={2} md={2}>
        <Chip
          avatar={<Avatar>{firstLetter(props.data.sender)}</Avatar>}
          label={props.data.sender}
          variant="outlined" />
      </Grid>
      <Grid item xs={12} md={10}>
        {props.data.messages.map((msg, i) => {
          return (
            <Grid item key={i}>
              <Message>{msg.text}</Message>
            </Grid>
          );
        })}
      </Grid>

    </Grid>
  );
}
