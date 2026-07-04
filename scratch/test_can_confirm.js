const groups = [
  { id: 1, min_selection: 0 },
  { id: 2, min_selection: "0" },
  { id: 3, min_select: 0 },
  { id: 4, min_select: "0" },
  { id: 5, min_selection: null }
];
const selected = [];

const incomplete = groups.filter(
  g => selected.filter(m => m.group_id === g.id).length < (g.min_selection || g.min_select || 0)
);

console.log(incomplete);
