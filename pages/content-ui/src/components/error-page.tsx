import { AlertIcon } from "@primer/octicons-react";
import { Box, Button, ThemeProvider } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import type { ColorModeWithAuto } from "node_modules/@primer/react/lib-esm/ThemeProvider";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ErrorPortalProps = {
	element: HTMLElement;
	message?: string;
	docs?: string;
};

export function ErrorPortal({ element, message, docs }: ErrorPortalProps) {
	const [container, setContainer] = useState<HTMLElement>();

	useEffect(() => {
		const diff = element.querySelector<HTMLElement>(".js-file-content");

		if (diff != null) {
			const div = document.createElement("div");
			diff.insertBefore(div, diff.firstChild);
			setContainer(div);
		}
	}, [element]);

	function hideMessage() {
		// delete the div element from the DOM
		container?.remove();
	}

	return (
		container &&
		createPortal(
			<Box
				sx={{
					marginBottom: "40px",
					marginTop: "40px",
				}}
			>
				<Blankslate border narrow>
					<Blankslate.Visual>
						<AlertIcon size={48} />
					</Blankslate.Visual>
					<Blankslate.Heading>Something went wrong.</Blankslate.Heading>
					<Blankslate.Description>
						{message ||
							"Sorry, the rich preview can't be displayed for this file."}
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
						{docs && (
							<Button as="a" href={docs} variant="primary">
								Read more
							</Button>
						)}
						<Button variant="danger" onClick={hideMessage}>
							Hide this message
						</Button>
					</Box>
				</Blankslate>
			</Box>,
			container,
		)
	);
}

export type ErrorPageProps = {
	elements: HTMLElement[];
	colorMode: ColorModeWithAuto;
	message?: string;
	docs?: string;
};

export function ErrorPage({
	elements,
	colorMode,
	message,
	docs,
}: ErrorPageProps): React.ReactElement {
	return (
		<ThemeProvider colorMode={colorMode}>
			{elements.map((element) => (
				<ErrorPortal
					key={element.tagName}
					element={element}
					message={message}
					docs={docs}
				/>
			))}
		</ThemeProvider>
	);
}
