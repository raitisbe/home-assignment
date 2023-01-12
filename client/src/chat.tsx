import { Grid, IconButton, TextField } from '@mui/material';
import { Block } from './block';
import SendIcon from '@mui/icons-material/Send';

const blocks = [
  {
    sender: 'raitis',
    messages: [{id: 'aaa', text: 'aaaaa'}, {id: 'aaa2', text: 'zzz'}],
  },
  {
    sender: 'maija',
    messages: [{id: 'aaa', text: 'fasdsds'}],
  },
]

const SendButton = () => (
  <IconButton>
    <SendIcon />
  </IconButton>
  )

export function Chat() {
  return (
    <div>
      <Grid container justifyContent={'center'} spacing={2}>
        <Grid item xs={12} md={8}>
        {blocks.map((block, i) => {
          return (
            <Block data={block}></Block>
          )
       })
      }
      </Grid>
        <Grid item xs={12} md={8}>
          <TextField label="Message:" variant="outlined" fullWidth InputProps={{endAdornment: <SendButton />}}/>
        </Grid>
      </Grid>
    </div>
  );
}



