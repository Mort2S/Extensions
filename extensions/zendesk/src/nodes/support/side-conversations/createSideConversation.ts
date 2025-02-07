import {
    createNodeDescriptor,
    INodeFunctionBaseParams,
} from "@cognigy/extension-tools";
import axios from "axios";

export interface ICreateSideConversationParams extends INodeFunctionBaseParams {
    config: {
        connectionType: string;
        userConnection: {
            username: string;
            password: string;
            subdomain: string;
        };
        apiTokenConnection: {
            emailAddress: string; // Verbindung: API-Token Email (für Authentifizierung)
            apiToken: string;
            subdomain: string;
        };
        ticketId: number;
        subject: string;
        body: string;
        conversationType: string;
        scEmailAdress: string; // Side Conversation E-Mail-Adresse (statt "emailAddress")
        slackWorkspaceId: string;
        slackChannelId: string;
        supportGroupId: string;
        supportAgentId: string;
        msteamsChannelId: string;
        storeLocation: string;
        contextKey: string;
        inputKey: string;
    };
}

export const createSideConversationNode = createNodeDescriptor({
    type: "createSideConversation",
    defaultLabel: {
        default: "Side Conversation erstellen",
        deDE: "Side Conversation erstellen",
        esES: "Crear Side Conversation",
    },
    summary: {
        default: "Erstellt eine neue Side Conversation in Zendesk",
        deDE: "Erstellt eine neue Side Conversation in Zendesk",
        esES: "Crea una nueva Side Conversation en Zendesk",
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
            label: {
                default: "Ticket ID",
                deDE: "Ticket-ID",
            },
            type: "cognigyText",
            params: {
                required: true,
            },
        },
        {
            key: "subject",
            label: {
                default: "Subject",
                deDE: "Betreff",
                esES: "Tema",
            },
            type: "cognigyText",
            description: {
                default: "Der Betreff der Side Conversation",
            },
            params: {
                required: true,
            },
        },
        {
            key: "body",
            label: {
                default: "Beschreibung",
                deDE: "Beschreibung",
                esES: "Descripción",
            },
            type: "cognigyText",
            description: {
                default: "Der Inhalt der Side Conversation",
            },
            params: {
                required: true,
            },
        },
        {
            key: "conversationType",
            label: {
                default: "Side Conversation Typ",
                deDE: "Side Conversation Typ",
            },
            type: "select",
            defaultValue: "email",
            params: {
                required: true,
                options: [
                    { label: "Email", value: "email" },
                    { label: "Slack", value: "slack" },
                    { label: "Child Ticket", value: "childTicket" },
                    { label: "Microsoft Teams", value: "msteams" },
                ],
            },
        },
        {
            key: "scEmailAdress",
            label: {
                default: "Side Conversation E-Mail Adresse",
                deDE: "E-Mail Adresse der Side Conversation",
            },
            type: "cognigyText",
            params: {
                required: true,
            },
            condition: {
                key: "conversationType",
                value: "email",
            },
        },
        {
            key: "slackWorkspaceId",
            label: {
                default: "Slack Workspace ID",
                deDE: "Slack Workspace ID",
            },
            type: "cognigyText",
            params: {
                required: true,
            },
            condition: {
                key: "conversationType",
                value: "slack",
            },
        },
        {
            key: "slackChannelId",
            label: {
                default: "Slack Channel ID",
                deDE: "Slack Channel ID",
            },
            type: "cognigyText",
            params: {
                required: true,
            },
            condition: {
                key: "conversationType",
                value: "slack",
            },
        },
        {
            key: "supportGroupId",
            label: {
                default: "Support Group ID",
                deDE: "Support Group ID",
            },
            type: "cognigyText",
            params: {
                required: true,
            },
            condition: {
                key: "conversationType",
                value: "childTicket",
            },
        },
        {
            key: "supportAgentId",
            label: {
                default: "Support Agent ID",
                deDE: "Support Agent ID",
            },
            type: "cognigyText",
            params: {
                required: false,
            },
            condition: {
                key: "conversationType",
                value: "childTicket",
            },
        },
        {
            key: "msteamsChannelId",
            label: {
                default: "MS Teams Channel ID",
                deDE: "MS Teams Channel ID",
            },
            type: "cognigyText",
            params: {
                required: true,
            },
            condition: {
                key: "conversationType",
                value: "msteams",
            },
        },
        {
            key: "storeLocation",
            label: {
                default: "Wo soll das Ergebnis gespeichert werden?",
                deDE: "Wo soll das Ergebnis gespeichert werden?",
                esES: "Dónde almacenar el resultado",
            },
            type: "select",
            defaultValue: "input",
            params: {
                required: true,
                options: [
                    { label: "Input", value: "input" },
                    { label: "Context", value: "context" },
                ],
            },
        },
        {
            key: "inputKey",
            label: {
                default: "Input Key zum Speichern des Ergebnisses",
                deDE: "Input Key zum Speichern des Ergebnisses",
            },
            type: "cognigyText",
            defaultValue: "zendesk.sideConversation",
            condition: {
                key: "storeLocation",
                value: "input",
            },
        },
        {
            key: "contextKey",
            label: {
                default: "Context Key zum Speichern des Ergebnisses",
                deDE: "Context Key zum Speichern des Ergebnisses",
            },
            type: "cognigyText",
            defaultValue: "zendesk.sideConversation",
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
                default: "Speicheroption",
                deDE: "Speicheroption",
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
        { type: "field", key: "subject" },
        { type: "field", key: "body" },
        { type: "field", key: "conversationType" },
        { type: "field", key: "scEmailAdress" },
        { type: "field", key: "slackWorkspaceId" },
        { type: "field", key: "slackChannelId" },
        { type: "field", key: "supportGroupId" },
        { type: "field", key: "supportAgentId" },
        { type: "field", key: "msteamsChannelId" },
        { type: "section", key: "storage" },
    ],
    appearance: {
        color: "#00363d",
    },
    function: async ({ cognigy, config }: ICreateSideConversationParams) => {
        const { api } = cognigy;
        const {
            userConnection,
            apiTokenConnection,
            connectionType,
            ticketId,
            subject,
            body,
            conversationType,
            scEmailAdress,
            slackWorkspaceId,
            slackChannelId,
            supportGroupId,
            supportAgentId,
            msteamsChannelId,
            storeLocation,
            contextKey,
            inputKey,
        } = config;

        const { username, password, subdomain: userSubdomain } = userConnection;
        const { emailAddress: tokenEmail, apiToken, subdomain: tokenSubdomain } = apiTokenConnection;

        const subdomain = connectionType === "apiToken" ? tokenSubdomain : userSubdomain;

        let messageData: any = {
            subject,
            body,
        };

        if (conversationType === "email") {
            messageData.to = [{ email: scEmailAdress }];
        } else if (conversationType === "slack") {
            messageData.to = [{
                slack_workspace_id: slackWorkspaceId,
                slack_channel_id: slackChannelId,
            }];
        } else if (conversationType === "childTicket") {
            let participant: any = { support_group_id: supportGroupId };
            if (supportAgentId && supportAgentId.trim() !== "") {
                participant.support_agent_id = supportAgentId;
            }
            messageData.to = [participant];
        } else if (conversationType === "msteams") {
            messageData.to = [{ msteams_channel_id: msteamsChannelId }];
        }

        const data = JSON.stringify({ message: messageData });

        try {
            const response = await axios({
                method: "post",
                url: `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}/side_conversations`,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                data: data,
                auth: {
                    username: connectionType === "apiToken" ? `${tokenEmail}/token` : username,
                    password: connectionType === "apiToken" ? apiToken : password,
                },
            });

            if (storeLocation === "context") {
                api.addToContext(contextKey, response.data, "simple");
            } else {
                api.addToInput(inputKey, response.data);
            }
        } catch (error: any) {
            if (storeLocation === "context") {
                api.addToContext(contextKey, { error: error.message }, "simple");
                api.addToContext(contextKey, data, "simple");
            } else {
                api.addToInput(inputKey, { error: error.message });
            }
        }
    },
});
