// Console operators. There is no sign-in in this build: the header switcher
// picks who you are working as, which keeps the permission split demoable
// with no sign-in step in front of it.
//
// If authentication goes back in, this list is what a user table replaces, and
// `role` is what the edit gate should read from a session instead of state.

export const OPERATORS = [
  {
    id: 'AG-2041',
    name: 'Arindam Roy',
    initials: 'AR',
    role: 'agent',
    team: 'Kolkata circle · Retention pod 3',
  },
  {
    id: 'SV-0117',
    name: 'Shalini Iyer',
    initials: 'SI',
    role: 'supervisor',
    team: 'Kolkata circle · Care operations',
  },
];

export const DEFAULT_OPERATOR = OPERATORS[1];

// The customer app renders one account. This is the same person who sits first
// in the care queue, which is what makes the cross-app loop demonstrable.
export const ACCOUNT = {
  id: 'C-88214',
  name: 'Sanyam Gupta',
  number: '98301 •• 4471',
};
