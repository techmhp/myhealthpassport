import type { OpenNextConfig } from "open-next/types/open-next";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "aws-lambda-streaming",
    },
  },
};

export default config;
