import { ArrowRightIcon } from "@primer/octicons-react";
import { Box, Button, Dialog, Label } from "@primer/react";
import { DataTable, Table } from "@primer/react/experimental";
import type { Results } from "node_modules/@stacc/dmn-differ/_dist/src/change-handler";
import { useRef, useState } from "react";

type AttributeValue = {
	oldValue?: string | number | { body: string };
	newValue?: string | number | { body: string };
};

type Diff = {
	changed: Record<
		string,
		{
			model: {
				id: string;
				name: string;
				$type: string;
			};
			attrs: Record<string, AttributeValue>;
		}
	>;
	removed: Record<
		string,
		{
			id: string;
			name: string;
			$type: string;
		}
	>;
	added: Record<
		string,
		{
			id: string;
			name: string;
			$type: string;
		}
	>;
};

function createData(diff: Diff) {
	const data: Array<{
		id: string;
		name: string;
		type: string;
		change: string;
		attributes?: Record<string, AttributeValue>;
	}> = [];
	Object.keys(diff).forEach((key) => {
		switch (key) {
			case "removed":
				Object.values(diff.removed).forEach((element) => {
					data.push({
						id: element.id,
						name: element.name,
						type: element.$type,
						change: "removed",
					});
				});
				break;
			case "added":
				Object.values(diff.added).forEach((element) => {
					data.push({
						id: element.id,
						name: element.name,
						type: element.$type,
						change: "added",
					});
				});
				break;
			case "changed":
				Object.values(diff.changed).forEach((element) => {
					data.push({
						id: element?.model?.id,
						name: element?.model?.name,
						type: element?.model?.$type,
						change: "changed",
						attributes: element?.attrs,
					});
				});
				break;
		}
	});
	return data;
}

export function ChangedDialog({ diff }: { diff?: Results | null }) {
	const [isOpen, setIsOpen] = useState(false);
	const returnFocusRef = useRef(null);
	console.log(diff);
	if (!diff) return null;

	const data = createData(diff as unknown as Diff);

	const pageSize = 10;
	const [pageIndex, setPageIndex] = useState(0);
	const start = pageIndex * pageSize;
	const end = start + pageSize;
	const rows = data
		.slice(start, end)
		.filter(
			(row, index, self) => index === self.findIndex((t) => t.id === row.id),
		);
	return (
		<div>
			<Button
				ref={returnFocusRef}
				variant="default"
				onClick={() => setIsOpen(true)}
			>
				All changes
			</Button>
			<Dialog
				returnFocusRef={returnFocusRef}
				isOpen={isOpen}
				onDismiss={() => setIsOpen(false)}
				sx={{
					width: "90%",
				}}
				aria-labelledby="header"
			>
				<div>
					<Dialog.Header id="header">All changes</Dialog.Header>
					<Box p={4}>
						<Table.Container>
							<DataTable
								aria-labelledby="header"
								aria-describedby="changes-subtitle"
								data={rows}
								columns={[
									{
										header: "ID",
										field: "id",
										rowHeader: true,
									},
									{
										header: "Name",
										field: "name",
										rowHeader: true,
									},
									{
										header: "Type",
										field: "type",
										sortBy: "alphanumeric",
									},
									{
										header: "Change",
										field: "change",
										sortBy: "alphanumeric",
										renderCell: (row) => {
											return (
												<Label
													variant={
														row.change === "removed"
															? "danger"
															: row.change === "added"
																? "success"
																: "attention"
													}
												>
													{row.change}
												</Label>
											);
										},
									},
									{
										header: "Attributes",
										field: "attributes",
										renderCell: (row) => {
											if (row.change !== "changed") return null;
											return (
												<Box
													sx={{ display: "flex", flexWrap: "wrap", gap: "5px" }}
												>
													{Object.entries(row.attributes || {}).map(
														([attributeName, attributeValue]) => {
															return (
																<Box
																	key={attributeName}
																	sx={{ display: "flex", gap: "5px" }}
																>
																	{typeof attributeValue.oldValue ===
																		"object" &&
																	Object.hasOwn(
																		attributeValue.oldValue,
																		"body",
																	) ? (
																		<Label variant="attention">
																			{attributeValue.oldValue.body}
																		</Label>
																	) : typeof attributeValue.oldValue !==
																		"object" ? (
																		<Label variant="attention">
																			{attributeValue.oldValue}
																		</Label>
																	) : null}
																	<Box sx={{ marginY: "auto" }}>
																		<ArrowRightIcon
																			verticalAlign="middle"
																			size={16}
																		/>
																	</Box>
																	{typeof attributeValue.newValue ===
																		"object" &&
																	Object.hasOwn(
																		attributeValue.newValue,
																		"body",
																	) ? (
																		<Label variant="success">
																			{attributeValue.newValue.body}
																		</Label>
																	) : typeof attributeValue.newValue !==
																		"object" ? (
																		<Label variant="success">
																			{attributeValue.newValue}
																		</Label>
																	) : null}
																</Box>
															);
														},
													)}
												</Box>
											);
										},
									},
								]}
								initialSortColumn="change"
								initialSortDirection="DESC"
							/>
							<Table.Pagination
								aria-label="Pagination for Changes"
								pageSize={pageSize}
								totalCount={data.length}
								onChange={({ pageIndex }) => {
									setPageIndex(pageIndex);
								}}
							/>
						</Table.Container>
					</Box>
				</div>
			</Dialog>
		</div>
	);
}
