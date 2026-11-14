import { Client } from "@elastic/elasticsearch";

const client = process.env.ELASTICSEARCH_URL
  ? new Client({ node: process.env.ELASTICSEARCH_URL })
  : null;

export default client;
