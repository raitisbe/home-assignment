
export type BlockModel = {
  sender: string;
  messages: {
    id: string;
    text: string;
  }[];
};
