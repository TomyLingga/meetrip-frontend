export function isUnlimitedPagu(pagu: any) {
  return pagu?.isUnlimited === true || pagu?.hasPagu === false || pagu?.nilaiLimit == null;
}

export function formatPaguLimit(pagu: any, value = pagu?.nilaiLimit) {
  if (isUnlimitedPagu(pagu)) return 'Unlimited';
  const amount = Number(value || 0);
  return pagu?.useDollar ? `$${amount.toLocaleString('en-US')}` : `Rp ${amount.toLocaleString('id-ID')}`;
}
