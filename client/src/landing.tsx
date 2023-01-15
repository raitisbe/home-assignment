import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Subject, takeUntil } from "rxjs";
import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Snackbar } from "@mui/material";

import { socketService } from "./sockets";

const theme = createTheme();

interface Props {
  navigate: any;
}

interface StateModel {
  errorOpen: boolean;
  message: string
}

export class Landing extends React.Component<Props, StateModel> {
  end = new Subject<void>();

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this.state = {errorOpen: false, message: ''};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.closeError = this.closeError.bind(this);
  }

  componentDidMount() {
    socketService.onConnect.pipe(takeUntil(this.end)).subscribe(() => {
      this.props.navigate("/chat");
    });

    socketService.onClose.pipe(takeUntil(this.end)).subscribe(() => {});
  }

  componentWillUnmount() {
    this.end.next();
  }

  async handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const encodedUsername = encodeURIComponent(data.get("username") as string);
    const response = await fetch(
      `http://${window.location.hostname}:8080/auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({username: encodedUsername}),
      }
    ).then((response) => response.json());
    if (response.success === true) {
      socketService.connect(response.sessionId);
    } else {
      this.setState({errorOpen: true, message: response.message})
    }
  }

  closeError(){
    this.setState({errorOpen: false})
  }

  render() {
    const action = (
      <React.Fragment>
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={this.closeError}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </React.Fragment>
    );

    return (
      <ThemeProvider theme={theme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography component="h1" variant="h5">
              Welcome to chat
            </Typography>
            <Box
              component="form"
              onSubmit={this.handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoFocus
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Enter
              </Button>
            </Box>
          </Box>
          <Snackbar
            anchorOrigin={{vertical: 'top', horizontal: 'center' }}
            open={this.state.errorOpen}
            onClose={this.closeError}
            message={this.state.message}
            action={action}
          />
        </Container>
      </ThemeProvider>
    );
  }
}
