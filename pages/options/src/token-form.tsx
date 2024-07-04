import { Box, Button, FormControl, Link, Text, TextInput } from "@primer/react";
import { type PropsWithChildren, useState } from "react";

export type TokenFormProps = {
	loading: boolean;
	onToken: (token: string) => void;
};

export function TokenForm({
	loading,
	onToken,
}: PropsWithChildren<TokenFormProps>) {
	const [token, setToken] = useState("");
	return (
		<Box>
			<FormControl required>
				<FormControl.Label>
					Enter a Github Personal Access Token (PAT)
				</FormControl.Label>
				<TextInput
					alt="Text input for token"
					value={token}
					loading={loading}
					onChange={(e) => setToken(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && onToken(token)}
				/>
				<Text color="fg.muted" as="ol" fontSize={12} px={3} py={0}>
					<li>
						Open{" "}
						<Link
							href="https://github.com/settings/tokens/new?scopes=repo&description=BPMN%20DMN%20diff%20viewer"
							target="_blank"
						>
							this link
						</Link>
					</li>
					<li>Click on Generate token</li>
					<li>Copy the provided token</li>
					<li>Paste it in the input above</li>
				</Text>
			</FormControl>
			<Button sx={{ mt: 2 }} onClick={() => onToken(token)}>
				Save
			</Button>
		</Box>
	);
}
