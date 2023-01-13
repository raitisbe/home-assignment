import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { socketService } from "./sockets";
import { Subject, takeUntil } from "rxjs";

const theme = createTheme();

interface Props {
  navigate: any;
}

interface StateModel {}

export class Landing extends React.Component<Props, StateModel> {
  end = new Subject<void>();

  componentDidMount() {
    socketService.onConnect.pipe(takeUntil(this.end)).subscribe(() => {
      this.props.navigate("/chat");
    });

    socketService.onClose.pipe(takeUntil(this.end)).subscribe(() => {});
  }

  componentWillUnmount() {
    this.end.next();
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const encodedUsername = encodeURIComponent(data.get("username") as string);
    socketService.connect(encodedUsername);
  }

  render() {
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
        </Container>
      </ThemeProvider>
    );
  }
}
