import { Box, Text } from "@primer/react";

export function ErrorMessage({ message }: { message?: string }) {
	return (
		<Box p={3}>
			<Text
				sx={{
					color: "fg.danger",
				}}
			>
				{message || "Sorry, the rich preview can't be displayed for this file."}
			</Text>
		</Box>
	);
}
