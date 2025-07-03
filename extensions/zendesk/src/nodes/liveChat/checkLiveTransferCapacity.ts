import {
  createNodeDescriptor,
  INodeFunctionBaseParams,
} from "@cognigy/extension-tools";
import axios from "axios";

export interface ICheckTransferCapacityParams extends INodeFunctionBaseParams {
  config: {
    chatConnection: {
      accessToken: string;
    };
    searchConnectionType: string;
    searchUserConnection: {
      username: string;
      password: string;
      subdomain: string;
    };
    searchApiTokenConnection: {
      emailAddress: string;
      apiToken: string;
      subdomain: string;
    };
    queryString: string;
    multiplier: number;
    storeLocation: string;
    contextKey: string;
    inputKey: string;
  };
}

export const checkLiveTransferCapacityNode = createNodeDescriptor({
  type: "checkLiveTransferCapacity",
  defaultLabel: {
    default: "Check Transfer Capacity",
    deDE: "Überprüfe Transferkapazität",
  },
  summary: {
    default:
      "Checks if live transfers are possible based on available agents and ongoing chats",
    deDE:
      "Prüft, ob Live-Transfers möglich sind, basierend auf verfügbaren Agenten und laufenden Chats",
  },
  fields: [
    {
      key: "chatConnection",
      label: {
        default: "Zendesk Chat Connection",
        deDE: "Zendesk Chat Verbindung",
      },
      type: "connection",
      params: {
        connectionType: "zendesk-chat",
        required: true,
      },
    },
    {
      key: "searchConnectionType",
      label: {
        default: "Search Connection Type",
        deDE: "Such-Verbindungstyp",
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
      key: "searchUserConnection",
      label: {
        default: "Zendesk Connection",
        deDE: "Zendesk Verbindung",
      },
      type: "connection",
      params: {
        connectionType: "zendesk",
        required: true,
      },
      condition: {
        key: "searchConnectionType",
        value: "user",
      },
    },
    {
      key: "searchApiTokenConnection",
      label: {
        default: "Zendesk API Token Connection",
      },
      type: "connection",
      params: {
        connectionType: "zendesk-api-token",
        required: true,
      },
      condition: {
        key: "searchConnectionType",
        value: "apiToken",
      },
    },
    {
      key: "queryString",
      label: {
        default: "Search Query String",
        deDE: "Such-String",
      },
      type: "cognigyText",
      params: {
        required: true,
      },
    },
    {
      key: "multiplier",
      label: {
        default: "Agent Multiplier",
        deDE: "Agenten-Multiplikator",
      },
      type: "number",
      defaultValue: 1,
      params: {
        required: true,
      },
    },
    {
      key: "storeLocation",
      type: "select",
      label: {
        default: "Where to store the result",
        deDE: "Wo soll das Ergebnis gespeichert werden",
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
        default: "Input Key to store result",
      },
      defaultValue: "zendesk.transferCapacity",
      condition: {
        key: "storeLocation",
        value: "input",
      },
    },
    {
      key: "contextKey",
      type: "cognigyText",
      label: {
        default: "Context Key to store result",
      },
      defaultValue: "zendesk.transferCapacity",
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
      },
      defaultCollapsed: true,
      fields: ["storeLocation", "inputKey", "contextKey"],
    },
  ],
  form: [
    { type: "field", key: "chatConnection" },
    { type: "field", key: "searchConnectionType" },
    { type: "field", key: "searchUserConnection" },
    { type: "field", key: "searchApiTokenConnection" },
    { type: "field", key: "queryString" },
    { type: "field", key: "multiplier" },
    { type: "section", key: "storage" },
  ],
  appearance: {
    color: "#00363d",
  },
  dependencies: {
    children: ["onTransfersPossible", "onTransfersNotPossible"],
  },
  function: async ({
    cognigy,
    config,
    childConfigs,
  }: ICheckTransferCapacityParams) => {
    const { api } = cognigy;
    const {
      chatConnection,
      searchConnectionType,
      searchUserConnection,
      searchApiTokenConnection,
      queryString,
      multiplier,
      storeLocation,
      contextKey,
      inputKey,
    } = config;
    const { accessToken } = chatConnection;
    const { username, password, subdomain: userSubdomain } = searchUserConnection;
    const {
      emailAddress,
      apiToken,
      subdomain: tokenSubdomain,
    } = searchApiTokenConnection;

    const subdomain =
      searchConnectionType === "apiToken" ? tokenSubdomain : userSubdomain;

    try {
      const agentResponse = await axios({
        method: "get",
        url: `https://rtm.zopim.com/stream/agents`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const agentsOnline = agentResponse.data?.content?.data?.agents_online || 0;

      const ticketResponse = await axios({
        method: "get",
        url: `https://${subdomain}.zendesk.com/api/v2/search.json?query=${queryString}`,
        headers: {
          Accept: "application/json",
        },
        auth: {
          username:
            searchConnectionType === "apiToken"
              ? `${emailAddress}/token`
              : username,
          password:
            searchConnectionType === "apiToken" ? apiToken : password,
        },
      });

      const ticketCount =
        typeof ticketResponse.data?.count === "number"
          ? ticketResponse.data.count
          : Array.isArray(ticketResponse.data?.results)
          ? ticketResponse.data.results.length
          : 0;

      const threshold = agentsOnline * multiplier;
      const canTransfer = ticketCount < threshold;

      const result = {
        agentsOnline,
        ticketCount,
        threshold,
        canTransfer,
      };

      const nextChild = canTransfer
        ? childConfigs.find((c) => c.type === "onTransfersPossible")
        : childConfigs.find((c) => c.type === "onTransfersNotPossible");
      if (nextChild) {
        api.setNextNode(nextChild.id);
      }

      if (storeLocation === "context") {
        api.addToContext(contextKey, result, "simple");
      } else {
        // @ts-ignore
        api.addToInput(inputKey, result);
      }
    } catch (error) {
      const onErrorChild = childConfigs.find(
        (c) => c.type === "onTransfersNotPossible",
      );
      if (onErrorChild) {
        api.setNextNode(onErrorChild.id);
      }

      if (storeLocation === "context") {
        api.addToContext(contextKey, { error: error.message }, "simple");
      } else {
        // @ts-ignore
        api.addToInput(inputKey, { error: error.message });
      }
    }
  },
});

export const onTransfersPossible = createNodeDescriptor({
  type: "onTransfersPossible",
  parentType: "checkLiveTransferCapacity",
  defaultLabel: {
    default: "Transfers Possible",
    deDE: "Transfers möglich",
  },
  constraints: {
    editable: false,
    deletable: false,
    creatable: false,
    movable: false,
    placement: {
      predecessor: {
        whitelist: [],
      },
    },
  },
  appearance: {
    color: "#61d188",
    textColor: "white",
    variant: "mini",
  },
});

export const onTransfersNotPossible = createNodeDescriptor({
  type: "onTransfersNotPossible",
  parentType: "checkLiveTransferCapacity",
  defaultLabel: {
    default: "Transfers Not Possible",
    deDE: "Transfers nicht möglich",
  },
  constraints: {
    editable: false,
    deletable: false,
    creatable: false,
    movable: false,
    placement: {
      predecessor: {
        whitelist: [],
      },
    },
  },
  appearance: {
    color: "#61d188",
    textColor: "white",
    variant: "mini",
  },
});