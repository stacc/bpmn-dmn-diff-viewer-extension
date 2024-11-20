export type DMNViewType = "drg" | "decisionTable" | "literalExpression";
export type View = {
	element: {
		id: string;
		name: string;
	} & Record<string, unknown>;
	id: string;
	type: string;
};
export type ViewsChangedEvent = {
	activeView: View;
	type?: string;
	views: Array<View>;
};
