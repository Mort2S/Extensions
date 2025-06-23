import { createNodeDescriptor, INodeFunctionBaseParams } from "@cognigy/extension-tools";
import axios from "axios";

export interface IAttachFlowDataParams extends INodeFunctionBaseParams {
  config: {
    connectionType: string;
    userConnection: {
      username: string;
      password: string;
      subdomain: string;
    };
    apiTokenConnection: {
      emailAddress: string;
      apiToken: string;
      subdomain: string;
    };
    ticketId: number;
    comment: string;
    storeLocation: string;
    contextKey: string;
    inputKey: string;
  };
}

export const attachFlowDataNode = createNodeDescriptor({
  type: "attachFlowData",
  defaultLabel: {
    default: "Attach Flow Data",
  },
  summary: {
    default: "Uploads input and context as JSON attachments to a ticket",
  },
  fields: [
    {
      key: "connectionType",
      label: {
        default: "Connection Type",
        deDE: "Verbindungstyp",
        esES: "Tipo de conexión",
      },
      type: "select",
      defaultValue: "user",
      params: {
        required: true,
        options: [
          { label: "API Token", value: "apiToken" },
          { label: "User", value: "user" },
        ],
      },
    },
    {
      key: "userConnection",
      label: { default: "Zendesk Connection" },
      type: "connection",
      params: { connectionType: "zendesk", required: true },
      condition: { key: "connectionType", value: "user" },
    },
    {
      key: "apiTokenConnection",
      label: { default: "Zendesk API Token Connection" },
      type: "connection",
      params: { connectionType: "zendesk-api-token", required: true },
      condition: { key: "connectionType", value: "apiToken" },
    },
    {
      key: "ticketId",
      label: "Ticket ID",
      type: "cognigyText",
      params: { required: true },
    },
    {
      key: "comment",
      label: { default: "Comment" },
      type: "cognigyText",
      defaultValue: "Attached flow data",
      params: { required: true },
    },
    {
      key: "storeLocation",
      type: "select",
      label: {
        default: "Where to store the result",
        deDE: "Wo das Ergebnis gespeichert werden soll",
        esES: "Dónde almacenar el resultado",
      },
      defaultValue: "input",
      params: {
        options: [
          { label: "Input", value: "input" },
          { label: "Context", value: "context" },
        ],
        required: true,
      },
    },
    {
      key: "inputKey",
      type: "cognigyText",
      label: {
        default: "Input Key to store Result",
        deDE: "Input Key zum Speichern des Ergebnisses",
        esES: "Input Key para almacenar el resultado",
      },
      defaultValue: "zendesk.attachments",
      condition: { key: "storeLocation", value: "input" },
    },
    {
      key: "contextKey",
      type: "cognigyText",
      label: {
        default: "Context Key to store Result",
        deDE: "Context Key zum Speichern des Ergebnisses",
        esES: "Context Key para almacenar el resultado",
      },
      defaultValue: "zendesk.attachments",
      condition: { key: "storeLocation", value: "context" },
    },
  ],
  sections: [
    {
      key: "storage",
      label: { default: "Storage Option" },
      defaultCollapsed: true,
      fields: ["storeLocation", "inputKey", "contextKey"],
    },
  ],
  form: [
    { type: "field", key: "connectionType" },
    { type: "field", key: "userConnection" },
    { type: "field", key: "apiTokenConnection" },
    { type: "field", key: "ticketId" },
    { type: "field", key: "comment" },
    { type: "section", key: "storage" },
  ],
  appearance: { color: "#00363d" },
  function: async ({ cognigy, config }: IAttachFlowDataParams) => {
    const { api, input, context } = cognigy;
    const {
      userConnection,
      apiTokenConnection,
      connectionType,
      ticketId,
      comment,
      storeLocation,
      contextKey,
      inputKey,
    } = config;

    const { username, password, subdomain: userSubdomain } = userConnection;
    const { emailAddress, apiToken, subdomain: tokenSubdomain } = apiTokenConnection;

    const subdomain = connectionType === "apiToken" ? tokenSubdomain : userSubdomain;

    try {
      const inputBuffer = Buffer.from(JSON.stringify(input));
      const inputUpload = await axios.post(
        `https://${subdomain}.zendesk.com/api/v2/uploads.json?filename=input.json`,
        inputBuffer,
        {
          headers: { "Content-Type": "application/binary" },
          auth: {
            username: connectionType === "apiToken" ? `${emailAddress}/token` : username,
            password: connectionType === "apiToken" ? apiToken : password,
          },
        }
      );

      const contextBuffer = Buffer.from(JSON.stringify(context));
      const contextUpload = await axios.post(
        `https://${subdomain}.zendesk.com/api/v2/uploads.json?filename=context.json`,
        contextBuffer,
        {
          headers: { "Content-Type": "application/binary" },
          auth: {
            username: connectionType === "apiToken" ? `${emailAddress}/token` : username,
            password: connectionType === "apiToken" ? apiToken : password,
          },
        }
      );

      const inputToken = inputUpload.data.upload.token;
      const contextToken = contextUpload.data.upload.token;

      const updateData = {
        ticket: {
          comment: {
            html_body: comment,
            uploads: [inputToken, contextToken],
          },
        },
      };

      const response = await axios({
        method: "put",
        url: `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}`,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        data: updateData,
        auth: {
          username: connectionType === "apiToken" ? `${emailAddress}/token` : username,
          password: connectionType === "apiToken" ? apiToken : password,
        },
      });

      if (storeLocation === "context") {
        api.addToContext(contextKey, response.data, "simple");
      } else {
        // @ts-ignore
        api.addToInput(inputKey, response.data);
      }
    } catch (error) {
      if (storeLocation === "context") {
        api.addToContext(contextKey, { error: error.message }, "simple");
      } else {
        // @ts-ignore
        api.addToInput(inputKey, { error: error.message });
      }
    }
  },
});