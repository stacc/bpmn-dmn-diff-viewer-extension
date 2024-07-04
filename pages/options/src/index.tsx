import { ThemeProvider } from "@primer/react";
import { createRoot } from "react-dom/client";
import { Settings } from "./settings";

const appContainer = document.querySelector("#app-container");
if (!appContainer) {
	throw new Error("Can not find #app-container");
}
const root = createRoot(appContainer);
root.render(
	<ThemeProvider colorMode="auto">
		<Settings />
	</ThemeProvider>,
);
