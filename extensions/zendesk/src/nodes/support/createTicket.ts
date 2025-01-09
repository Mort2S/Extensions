import { createNodeDescriptor, INodeFunctionBaseParams } from "@cognigy/extension-tools";
import axios from "axios";

export interface ICreateTicketParams extends INodeFunctionBaseParams {
	config: {
		connection: {
			username: string;
			password: string;
			subdomain: string;
		};
		subject: string;
		description: string;
		priority: string;
		storeLocation: string;
		contextKey: string;
		inputKey: string;
		specifyRequester: boolean;
		requesterName: string;
		requesterEmail: string;
		requesterLocaleId: string;
		specifyBrand: boolean;
		brandId: string;
		useCustomFields: boolean;
		customFields: string;
		addTags: boolean;
		tags: string;
		isPublic: string;
	};
}

export const createTicketNode = createNodeDescriptor({
	type: "createTicket",
	defaultLabel: {
		default: "Create Ticket",
		deDE: "Ticket erstellen",
		esES: "Crear Ticket"
	},
	summary: {
		default: "Creates a new support ticket",
		deDE: "Erstellt ein neues Support Ticket",
		esES: "Crea un nuevo ticket de soporte"
	},
	fields: [
		{
			key: "connection",
			label: {
				default: "Zendesk Connection",
				deDE: "Zendesk Verbindung",
				esES: "Zendesk Conexión"
			},
			type: "connection",
			params: {
				connectionType: "zendesk",
				required: true
			}
		},
		{
			key: "subject",
			type: "cognigyText",
			params: { required: true }
		},
		{
			key: "description",
			type: "cognigyText",
			params: { required: true }
		},
		{
			key: "priority",
			type: "select",
			defaultValue: "normal",
			params: {
				required: true,
				options: [
					{ label: "Normal", value: "normal" },
					{ label: "High", value: "high" },
					{ label: "Urgent", value: "urgent" }
				]
			}
		},
		{
			key: "isPublic",
			type: "string",
			label: {
				default: "Public",
				deDE: "Öffentlich"
			},
			description: {
				default: "If the description is public",
				deDE: "Ob die Beschreibung öffentlich ist"
			},
			params: {
				required: false
			}
		},
		{
			key: "storeLocation",
			type: "select",
			defaultValue: "input",
			params: {
				required: true,
				options: [
					{ label: "Input", value: "input" },
					{ label: "Context", value: "context" }
				]
			}
		},
		{
			key: "contextKey",
			type: "cognigyText",
			defaultValue: "zendesk.ticket",
			condition: { key: "storeLocation", value: "context" }
		},
		{
			key: "inputKey",
			type: "cognigyText",
			defaultValue: "zendesk.ticket",
			condition: { key: "storeLocation", value: "input" }
		}
	],
	appearance: {
		color: "#00363d"
	},
	function: async ({ cognigy, config }: ICreateTicketParams) => {
		const { api } = cognigy;
		const { connection, description, priority, subject, isPublic, storeLocation, contextKey, inputKey } = config;
		const { username, password, subdomain } = connection;

		let data = {
			ticket: {
				comment: {
					body: description,
					public: isPublic || true
				},
				priority,
				subject
			}
		};

		try {
			const response = await axios({
				method: "post",
				url: `https://${subdomain}.zendesk.com/api/v2/tickets`,
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
				},
				data: data,
				auth: {
					username,
					password
				}
			});

			if (storeLocation === "context") {
				api.addToContext(contextKey, response.data, "simple");
			} else {
				api.addToInput(inputKey, response.data);
			}
		} catch (error) {
			if (storeLocation === "context") {
				api.addToContext(contextKey, { error: error.message }, "simple");
			} else {
				api.addToInput(inputKey, { error: error.message });
			}
		}
	}
});
