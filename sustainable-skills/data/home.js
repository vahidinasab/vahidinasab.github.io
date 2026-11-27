/* The nine parts of the home picture.

   Each part: id, name, short (the button label), at [per cent across, per cent down] for its dot,
   what, links [subject id, topic] and who [label, job ids]. */
(function (S) {
  'use strict';
  var D = S.data;

  // Parts of the home explorer. "at" places the hotspot, in percent across and down the picture.
  D.parts = [
    { id: 'heatpump', name: 'Heat pump', at: [29.9, 79.6],
      what: 'A heat pump moves heat from the outside air into the home, like a fridge working in reverse, and runs on electricity instead of gas. In England and Wales the Boiler Upgrade Scheme gives £7,500 towards an air source heat pump fitted by an MCS-certified installer.',
      links: [['science', 'Heating and specific heat capacity'], ['science', 'Changes of state'], ['science', 'Power and efficiency'], ['science', 'Insulation']],
      who: [['Who installs it', ['heatpump', 'plumber']], ['Who maintains and repairs it', ['heatpump', 'refrig', 'eltech']], ['Who designs and plans it', ['buildserv', 'assessor']]] },
    { id: 'solar', name: 'Solar panels', at: [60.9, 31.9],
      what: 'Panels on the roof turn sunlight into electricity for the home, the home battery or the car.',
      links: [['science', 'Energy resources'], ['science', 'Batteries and the mains'], ['dt', 'Energy generation and storage'], ['maths', 'Percentages and growth']],
      who: [['Who installs it', ['solar', 'electrician']], ['Who maintains and repairs it', ['solar', 'electrician']], ['Who designs and plans it', ['renew']]] },
    { id: 'battery', name: 'Home battery', at: [40.4, 73.1],
      what: 'A home battery, often fitted on an outside wall, in a garage or in a utility room, stores electricity from the solar panels, or from the grid when it is cheaper, to use later in the day. Solar installers work with electricians to connect it.',
      links: [['science', 'Batteries and the mains'], ['science', 'Cells and fuel cells, in separate chemistry'], ['electronics', 'Diodes and rectification'], ['maths', 'Rates and unit pricing']],
      who: [['Who installs it', ['electrician', 'solar']], ['Who maintains and repairs it', ['electrician', 'eltech']], ['Who designs and plans it', ['electronics', 'renew']]] },
    { id: 'insulation', name: 'Loft and wall insulation', short: 'Insulation', at: [37.1, 36.3],
      what: 'Insulation keeps heat in, so the home needs less energy to stay warm. Heat pumps work best in well-insulated homes.',
      links: [['science', 'Insulation'], ['science', 'Heating and specific heat capacity'], ['dt', 'Life cycle assessment']],
      who: [['Who installs it', ['insulation']], ['Who checks the home and advises', ['assessor']]] },
    { id: 'smart', name: 'Smart meter and smart home controls', short: 'Smart controls', at: [55.3, 73.3],
      what: 'A smart meter shows how much energy the home uses, and smart controls can run the heating, battery and car charger at the best times. By June 2026 there were 42 million smart and advanced meters in homes and small businesses in Great Britain.',
      links: [['science', 'Power ratings of appliances'], ['dt', 'Programmable components'], ['computing', 'Networks'], ['computing', 'Cyber security'], ['economics', 'Supply, demand and price']],
      who: [['Who installs it', ['smartmeter', 'smarthome', 'electrician']], ['Who maintains and repairs it', ['electrician', 'buildserv']], ['Who designs and plans it', ['smarthome', 'electronics', 'data']]] },
    { id: 'ev', name: 'Electric car and charger', short: 'EV charging', at: [69.2, 81.7],
      what: 'The charger is wired into the home and talks to the car. Since June 2022, new home and workplace chargers in Great Britain have had to be smart. Technicians who service electric cars work with high-voltage batteries.',
      links: [['science', 'Mains electricity and safety'], ['science', 'Electric motors'], ['electronics', 'Sensing, processing and output'], ['maths', 'Rates and unit pricing']],
      who: [['Who installs it', ['electrician']], ['Who maintains and repairs it', ['evtech', 'electrician']], ['Who designs and plans it', ['electronics']]] },
    { id: 'wind', name: 'Community wind turbine', short: 'Local wind', at: [12.7, 15.6],
      what: 'Some wind turbines and solar farms are run by local community groups. Every turbine needs regular checks and servicing, often at height.',
      links: [['science', 'Energy resources'], ['science', 'Generators and transformers, in separate physics'], ['engineering', 'Energy, maintenance and end of life'], ['geography', 'Energy and resources']],
      who: [['Who installs it', ['wind']], ['Who maintains and repairs it', ['wind', 'eltech', 'maint']], ['Who designs and plans it', ['renew', 'sustain']]] },
    { id: 'grid', name: 'The power grid', short: 'Power grid', at: [92.4, 15.0],
      what: 'Power reaches homes through high-voltage lines, substations and underground cables. Network workers build and maintain them, and connect new equipment such as solar panels and chargers.',
      links: [['science', 'The National Grid'], ['science', 'Generators and transformers, in separate physics'], ['maths', 'Graphs and rates of change']],
      who: [['Who builds and maintains it', ['grid', 'eltech']], ['Who designs and plans it', ['renew', 'data']]] },
    { id: 'van', name: 'The local installer', short: 'Local firms', at: [6.8, 67.6],
      what: 'Much of this work is done by small local firms, like the one that owns this electric van. Running one means pricing jobs, buying equipment, managing cash and looking after customers.',
      links: [['business', 'Starting a business'], ['business', 'Cash flow'], ['maths', 'Percentages and growth']],
      who: [['Jobs in firms like this', ['electrician', 'heatpump', 'plumber', 'smartmeter', 'insulation']]] }
  ];
})(window.SLES = window.SLES || { data: {} });

/* What the picture shows, for people who cannot see it. */
window.SLES.data.sceneText = "An illustration of a red-brick family home in a local energy system. The roof has solar panels, and a cut-away shows the loft insulation. A heat pump, a home battery and smart controls are fitted at the house, and an electric car is charging on the drive from a charger on the wall. A local firm’s electric van is parked beside the house, a community wind turbine turns on the hill, and power lines bring electricity from the grid.";
