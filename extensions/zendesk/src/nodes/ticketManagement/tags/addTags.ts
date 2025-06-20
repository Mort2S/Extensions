import {
  createNodeDescriptor,
  INodeFunctionBaseParams,
} from "@cognigy/extension-tools";
import axios from "axios";

export interface ICreateTicketParams extends INodeFunctionBaseParams {
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
    storeLocation: string;
    contextKey: string;
    inputKey: string;
    tags: string;
    ticketId: number;
  };
}

export const addTagsNode = createNodeDescriptor({
  type: "createTicket",
  defaultLabel: {
    default: "Add tags",
  },
  summary: {
    default: "Adds tags to a support ticket",
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
          {
            label: "API Token",
            value: "apiToken",
          },
          {
            label: "User",
            value: "user",
          },
        ],
      },
    },
    {
      key: "userConnection",
      label: {
        default: "Zendesk Connection",
        deDE: "Zendesk Verbindung",
        esES: "Zendesk Conexión",
      },
      type: "connection",
      params: {
        connectionType: "zendesk",
        required: true,
      },
      condition: {
        key: "connectionType",
        value: "user",
      },
    },
    {
      key: "apiTokenConnection",
      label: {
        default: "Zendesk API Token Connection",
      },
      type: "connection",
      params: {
        connectionType: "zendesk-api-token",
        required: true,
      },
      condition: {
        key: "connectionType",
        value: "apiToken",
      },
    },
    {
      key: "ticketId",
      label: "Ticket ID",
      type: "cognigyText",
      description: {
        default: "The ID of the support ticket",
        deDE: "Die ID des Support Tickets",
        esES: "La identificación del ticket de soporte",
      },
      params: {
        required: true,
      },
    },
    {
      key: "tags",
      label: {
        default: "Tags",
        deDE: "Tags",
        esES: "Etiquetas",
      },
      type: "json",
      params: {
        required: true,
      },
      defaultValue: ["enterprise", "other_tag"],
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
          {
            label: "Input",
            value: "input",
          },
          {
            label: "Context",
            value: "context",
          },
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
      defaultValue: "zendesk.ticket",
      condition: {
        key: "storeLocation",
        value: "input",
      },
    },
    {
      key: "contextKey",
      type: "cognigyText",
      label: {
        default: "Context Key to store Result",
        deDE: "Context Key zum Speichern des Ergebnisses",
        esES: "Context Key para almacenar el resultado",
      },
      defaultValue: "zendesk.ticket",
      condition: {
        key: "storeLocation",
        value: "context",
      },
    },
  ],
  sections: [
    {
      key: "storage",
      label: {
        default: "Storage Option",
        deDE: "Speicheroption",
        esES: "Opción de almacenamiento",
      },
      defaultCollapsed: true,
      fields: ["storeLocation", "inputKey", "contextKey"],
    },
  ],
  form: [
    { type: "field", key: "connectionType" },
    { type: "field", key: "userConnection" },
    { type: "field", key: "apiTokenConnection" },
    { type: "field", key: "ticketId" },
    { type: "field", key: "tags" },
    { type: "section", key: "storage" },
  ],
  appearance: {
    color: "#00363d",
  },
  function: async ({ cognigy, config }: ICreateTicketParams) => {
    const { api } = cognigy;
    const {
      userConnection,
      apiTokenConnection,
      connectionType,
      ticketId,
      tags,
      storeLocation,
      contextKey,
      inputKey,
    } = config;
    const { username, password, subdomain: userSubdomain } = userConnection;
    const {
      emailAddress,
      apiToken,
      subdomain: tokenSubdomain,
    } = apiTokenConnection;

    const subdomain =
      connectionType === "apiToken" ? tokenSubdomain : userSubdomain;

    let data = {
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? [tags] : [],
    };

    try {
      const response = await axios({
        method: "put",
        url: `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}/tags`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: data,
        auth: {
          username:
            connectionType === "apiToken" ? `${emailAddress}/token` : username,
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
