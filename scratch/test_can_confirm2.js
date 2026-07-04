const groups = [
  { id: 1, min_selection: undefined, min_select: undefined }
];
const selected = [];

const incomplete = groups.filter(
  g => selected.filter(m => m.group_id === g.id).length < (g.min_selection || g.min_select || 0)
);

console.log(incomplete);
