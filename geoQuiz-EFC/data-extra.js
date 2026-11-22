/**
 * GeoQuiz - Extra countries (compact table, merged into GQ_DATA.countries)
 * Row: [name (es), capital, continent, ISO 3166-1 alpha-2, level]
 * The flag emoji is derived from the ISO code; localized names come from Intl.DisplayNames.
 */
(function () {
  const EU = 'Europa', AS = 'Asia', AF = 'África', NA = 'América del Norte', SA = 'América del Sur', OC = 'Oceanía';
  const rows = [
    // Europa
    ['Austria','Viena',EU,'AT',2], ['Hungría','Budapest',EU,'HU',2], ['Chequia','Praga',EU,'CZ',2],
    ['Rumanía','Bucarest',EU,'RO',2], ['Finlandia','Helsinki',EU,'FI',2], ['Dinamarca','Copenhague',EU,'DK',2],
    ['Ucrania','Kiev',EU,'UA',2], ['Croacia','Zagreb',EU,'HR',2], ['Islandia','Reikiavik',EU,'IS',2],
    ['Bulgaria','Sofía',EU,'BG',3], ['Serbia','Belgrado',EU,'RS',3], ['Eslovaquia','Bratislava',EU,'SK',3],
    ['Eslovenia','Liubliana',EU,'SI',3], ['Lituania','Vilna',EU,'LT',3], ['Letonia','Riga',EU,'LV',3],
    ['Estonia','Tallin',EU,'EE',3], ['Luxemburgo','Luxemburgo',EU,'LU',3], ['Malta','La Valeta',EU,'MT',3],
    ['Albania','Tirana',EU,'AL',3], ['Bosnia y Herzegovina','Sarajevo',EU,'BA',3], ['Macedonia del Norte','Skopie',EU,'MK',3],
    ['Moldavia','Chisináu',EU,'MD',3], ['Bielorrusia','Minsk',EU,'BY',3], ['Montenegro','Podgorica',EU,'ME',3],
    ['Andorra','Andorra la Vieja',EU,'AD',3], ['Mónaco','Mónaco',EU,'MC',3], ['Chipre','Nicosia',EU,'CY',3],
    // Asia
    ['Tailandia','Bangkok',AS,'TH',2], ['Malasia','Kuala Lumpur',AS,'MY',2], ['Singapur','Singapur',AS,'SG',2],
    ['Irak','Bagdad',AS,'IQ',3], ['Afganistán','Kabul',AS,'AF',3], ['Siria','Damasco',AS,'SY',3],
    ['Jordania','Amán',AS,'JO',3], ['Líbano','Beirut',AS,'LB',3], ['Emiratos Árabes Unidos','Abu Dabi',AS,'AE',3],
    ['Catar','Doha',AS,'QA',3], ['Bangladés','Daca',AS,'BD',3], ['Nepal','Katmandú',AS,'NP',3],
    ['Sri Lanka','Colombo',AS,'LK',3], ['Mongolia','Ulán Bator',AS,'MN',3], ['Kazajistán','Astaná',AS,'KZ',3],
    ['Uzbekistán','Taskent',AS,'UZ',3], ['Camboya','Nom Pen',AS,'KH',3], ['Laos','Vientián',AS,'LA',3],
    ['Birmania','Naipyidó',AS,'MM',3], ['Corea del Norte','Pionyang',AS,'KP',3], ['Georgia','Tiflis',AS,'GE',3],
    ['Armenia','Ereván',AS,'AM',3], ['Azerbaiyán','Bakú',AS,'AZ',3], ['Taiwán','Taipéi',AS,'TW',3],
    ['Bután','Timbu',AS,'BT',3], ['Maldivas','Malé',AS,'MV',3],
    // África
    ['Argelia','Argel',AF,'DZ',2], ['Etiopía','Adís Abeba',AF,'ET',2], ['Túnez','Túnez',AF,'TN',2],
    ['Ghana','Acra',AF,'GH',2], ['Senegal','Dakar',AF,'SN',2],
    ['Libia','Trípoli',AF,'LY',3], ['Costa de Marfil','Yamusukro',AF,'CI',3], ['Camerún','Yaundé',AF,'CM',3],
    ['Angola','Luanda',AF,'AO',3], ['Tanzania','Dodoma',AF,'TZ',3], ['Uganda','Kampala',AF,'UG',3],
    ['Mozambique','Maputo',AF,'MZ',3], ['Madagascar','Antananarivo',AF,'MG',3], ['Zimbabue','Harare',AF,'ZW',3],
    ['Sudán','Jartum',AF,'SD',3], ['República Democrática del Congo','Kinsasa',AF,'CD',3], ['Namibia','Windhoek',AF,'NA',3],
    ['Botsuana','Gaborone',AF,'BW',3], ['Mali','Bamako',AF,'ML',3], ['Somalia','Mogadiscio',AF,'SO',3],
    // América
    ['Uruguay','Montevideo',SA,'UY',2], ['Ecuador','Quito',SA,'EC',2], ['Bolivia','Sucre',SA,'BO',2],
    ['Paraguay','Asunción',SA,'PY',2], ['Costa Rica','San José',NA,'CR',2], ['Panamá','Panamá',NA,'PA',2],
    ['Guyana','Georgetown',SA,'GY',3], ['Surinam','Paramaribo',SA,'SR',3], ['Guatemala','Ciudad de Guatemala',NA,'GT',3],
    ['Honduras','Tegucigalpa',NA,'HN',3], ['El Salvador','San Salvador',NA,'SV',3], ['Nicaragua','Managua',NA,'NI',3],
    ['República Dominicana','Santo Domingo',NA,'DO',3], ['Haití','Puerto Príncipe',NA,'HT',3], ['Jamaica','Kingston',NA,'JM',3],
    ['Bahamas','Nasáu',NA,'BS',3],
    // Oceanía
    ['Fiyi','Suva',OC,'FJ',3], ['Papúa Nueva Guinea','Port Moresby',OC,'PG',3], ['Samoa','Apia',OC,'WS',3], ['Tonga','Nukualofa',OC,'TO',3],
  ];
  const flagOf = (iso) => String.fromCodePoint(...[...iso].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
  const have = new Set(GQ_DATA.countries.map(c => c.name));
  rows.forEach(([name, capital, continent, iso, level]) => {
    if (have.has(name)) return;
    GQ_DATA.countries.push({ name, nameEn: name, capital, continent, flag: flagOf(iso), level });
  });
  // ISO code for every country (derived from the flag emoji), used for localized names
  GQ_DATA.countries.forEach(c => {
    const cps = [...c.flag].map(ch => ch.codePointAt(0) - 0x1F1E6 + 65);
    c.iso = String.fromCharCode(...cps);
  });
})();
