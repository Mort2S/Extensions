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
      queryString: string;
      storeLocation: string;
      contextKey: string;
      inputKey: string;
    };
  }
  
  export const searchTicketsNode = createNodeDescriptor({
    type: "searchTickets",
    defaultLabel: {
      default: "Search Zendesk Tickets",
      deDE: "Zendesk Tickets suchen",
      esES: "Buscar tickets de Zendesk",
    },
    summary: {
      default: "Search for Zendesk tickets based on a query string",
      deDE: "Suche nach Zendesk-Tickets basierend auf einem Abfrage-String",
      esES: "Buscar tickets de Zendesk basados en una cadena de consulta",
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
        key: "queryString",
        label: {
          default: "Query String",
          deDE: "Abfrage-String",
          esES: "Cadena de consulta",
        },
        type: "cognigyText",
        description: {
          default: "The query string to search for tickets",
          deDE: "Der Abfrage-String zur Suche nach Tickets",
          esES: "La cadena de consulta para buscar tickets",
        },
        params: {
          required: true,
        },
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
        defaultValue: "zendesk.tickets",
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
        defaultValue: "zendesk.tickets",
        condition: {
          key: "storeLocation",
          value: "context",
        },
      },
    ],
    form: [
      { type: "field", key: "connectionType" },
      { type: "field", key: "userConnection" },
      { type: "field", key: "apiTokenConnection" },
      { type: "field", key: "queryString" },
      { type: "field", key: "storeLocation" },
      { type: "field", key: "inputKey" },
      { type: "field", key: "contextKey" },
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
        queryString,
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
  
      try {
        const response = await axios({
          method: "get",
          url: `https://${subdomain}.zendesk.com/api/v2/search.json?query=${queryString}`,
          headers: {
            Accept: "application/json",
          },
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