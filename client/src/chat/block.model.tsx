export type BlockModel = {
  sender: string;
  messages: {
    text: string;
    date: string;
  }[];
};
