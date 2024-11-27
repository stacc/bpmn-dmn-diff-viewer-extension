import { ArrowRightIcon, ZoomInIcon } from "@primer/octicons-react";
import { Box, Button, Dialog, IconButton, Label } from "@primer/react";
import { DataTable, Table } from "@primer/react/experimental";
import { useRef, useState } from "react";
import type { Diff } from "./bpmn-viewer";

type AttributeValue = {
	oldValue?: string | number | { body: string; text: string };
	newValue?: string | number | { body: string; text: string };
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
			case "_removed":
				Object.values(diff._removed).forEach((element) => {
					data.push({
						id: element.id,
						name: element.name,
						type: element.$type,
						change: "removed",
					});
				});
				break;
			case "_added":
				Object.values(diff._added).forEach((element) => {
					data.push({
						id: element.id,
						name: element.name,
						type: element.$type,
						change: "added",
					});
				});
				break;
			case "_changed":
				Object.values(diff._changed).forEach((element) => {
					data.push({
						id: element?.model?.id,
						name: element?.model?.name,
						type: element?.model?.$type,
						change: "changed",
						attributes: element?.attrs,
					});
				});
				break;
			case "_layoutChanged":
				Object.values(diff._layoutChanged).forEach((element) => {
					data.push({
						id: element.id,
						name: element.name,
						type: element.$type,
						change: "layout changed",
					});
				});
				break;
		}
	});
	return data;
}

export function ChangedDialog({
	diff,
	hightlight,
}: {
	diff?: Diff | null;
	hightlight: (id: string) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const returnFocusRef = useRef(null);

	if (!diff) return null;

	const data = createData(diff);

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
																	attributeValue.oldValue !== null &&
																	Object.hasOwn(
																		attributeValue.oldValue,
																		"text",
																	) ? (
																		<Label variant="attention">
																			{attributeValue.oldValue.text ||
																				attributeValue.oldValue.body}
																		</Label>
																	) : typeof attributeValue.oldValue !==
																		"object" ? (
																		<>
																			<Label variant="attention">
																				{attributeValue.oldValue}
																			</Label>
																			<Box sx={{ marginY: "auto" }}>
																				<ArrowRightIcon
																					verticalAlign="middle"
																					size={16}
																				/>
																			</Box>
																		</>
																	) : null}
																	{typeof attributeValue.newValue ===
																		"object" &&
																	attributeValue.newValue !== null &&
																	Object.hasOwn(
																		attributeValue.newValue,
																		"text",
																	) ? (
																		<Label variant="success">
																			{attributeValue.newValue.text ||
																				attributeValue.newValue.body}
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
									{
										id: "actions",
										header: () => (
											<span style={{ display: "none" }}>Actions</span>
										),
										align: "end",
										renderCell: (row) => {
											return (
												<IconButton
													aria-label={`Highlight: ${row.name || row.id}`}
													title={`Highlight: ${row.name || row.id}`}
													icon={ZoomInIcon}
													variant="invisible"
													onClick={() => {
														hightlight(row.id);
														setIsOpen(false);
													}}
												/>
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
