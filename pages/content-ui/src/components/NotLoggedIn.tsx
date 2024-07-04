import { MESSAGE_ID } from "@bpmn-dmn-diff-viewer-extension/shared";
import { ShieldLockIcon } from "@primer/octicons-react";
import { Box, Button, ThemeProvider } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import type { ColorModeWithAuto } from "@primer/react/lib/ThemeProvider";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NotLoggedInPortalProps = {
	element: HTMLElement;
};

export function NotLoggedInPortal({ element }: NotLoggedInPortalProps) {
	const [diffContainer, setDiffContainer] = useState<HTMLElement>();

	useEffect(() => {
		const diff = element.querySelector<HTMLElement>(".js-file-content");

		if (diff != null) {
			const div = document.createElement("div");
			diff.insertBefore(div, diff.firstChild);
			setDiffContainer(div);
		}
	}, [element]);

	async function openOptionsPage() {
		const response = await chrome.runtime.sendMessage({
			id: MESSAGE_ID.OPEN_OPTIONS_PAGE,
		});
		if (response && "error" in response) throw response.error;
	}

	function hideMessage() {
		// delete the div element from the DOM
		diffContainer?.remove();
	}

	return (
		diffContainer &&
		createPortal(
			<Box
				sx={{
					marginBottom: "40px",
					marginTop: "40px",
				}}
			>
				<Blankslate border narrow>
					<Blankslate.Visual>
						<ShieldLockIcon size={48} />
					</Blankslate.Visual>
					<Blankslate.Heading>
						You have not authorized the extension to access your Github account.
					</Blankslate.Heading>
					<Blankslate.Description>
						To be able to see a graphical representation of you diagram, please
						open the settings and follow the instructions to authorize the
						extension.
					</Blankslate.Description>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							gap: "10px",
							marginTop: "20px",
							justifySelf: "flex-start",
						}}
					>
						<Button variant="primary" onClick={openOptionsPage}>
							Open the settings
						</Button>
						<Button variant="danger" onClick={hideMessage}>
							Hide this message
						</Button>
					</Box>
				</Blankslate>
			</Box>,
			diffContainer,
		)
	);
}

export type NotLoggedInPageProps = {
	elements: HTMLElement[];
	colorMode: ColorModeWithAuto;
};

export function NotLoggedInPage({
	elements,
	colorMode,
}: NotLoggedInPageProps): React.ReactElement {
	return (
		<ThemeProvider colorMode={colorMode}>
			{elements.map((element) => (
				<NotLoggedInPortal key={element.tagName} element={element} />
			))}
		</ThemeProvider>
	);
}
