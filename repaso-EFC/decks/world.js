(function () {
  var D = (window.RepasoDecks = window.RepasoDecks || []);
  var L = function (es, en, eu, gl, ca, fr) { return { es: es, en: en, eu: eu, gl: gl, ca: ca, fr: fr }; };
  var P = function (s) { var p = s.split('|'); return L(p[0], p[1], p[2], p[3], p[4], p[5]); }; // es|en|eu|gl|ca|fr

  // ISO|es|en|eu|gl|ca|fr|capital ('-' = none/ambiguous)|continent (E,A,F,M=America,O)
  var rows = [
    'ES|España|Spain|Espainia|España|Espanya|Espagne|Madrid|E', 'FR|Francia|France|Frantzia|Francia|França|France|Paris|E', 'GB|Reino Unido|United Kingdom|Erresuma Batua|Reino Unido|Regne Unit|Royaume-Uni|London|E',
    'IT|Italia|Italy|Italia|Italia|Itàlia|Italie|Roma|E', 'DE|Alemania|Germany|Alemania|Alemaña|Alemanya|Allemagne|Berlin|E', 'PT|Portugal|Portugal|Portugal|Portugal|Portugal|Portugal|Lisboa|E',
    'AT|Austria|Austria|Austria|Austria|Àustria|Autriche|Wien|E', 'BE|Bélgica|Belgium|Belgika|Bélxica|Bèlgica|Belgique|Bruxelles|E', 'NL|Países Bajos|Netherlands|Herbehereak|Países Baixos|Països Baixos|Pays-Bas|Amsterdam|E',
    'CH|Suiza|Switzerland|Suitza|Suíza|Suïssa|Suisse|Bern|E', 'IE|Irlanda|Ireland|Irlanda|Irlanda|Irlanda|Irlande|Dublin|E', 'NO|Noruega|Norway|Norvegia|Noruega|Noruega|Norvège|Oslo|E',
    'SE|Suecia|Sweden|Suedia|Suecia|Suècia|Suède|Stockholm|E', 'FI|Finlandia|Finland|Finlandia|Finlandia|Finlàndia|Finlande|Helsinki|E', 'DK|Dinamarca|Denmark|Danimarka|Dinamarca|Dinamarca|Danemark|København|E',
    'IS|Islandia|Iceland|Islandia|Islandia|Islàndia|Islande|Reykjavik|E', 'GR|Grecia|Greece|Grezia|Grecia|Grècia|Grèce|Athína|E', 'PL|Polonia|Poland|Polonia|Polonia|Polònia|Pologne|Warszawa|E',
    'CZ|Chequia|Czechia|Txekia|Chequia|Txèquia|Tchéquie|Praha|E', 'HU|Hungría|Hungary|Hungaria|Hungría|Hongria|Hongrie|Budapest|E', 'RO|Rumanía|Romania|Errumania|Romanía|Romania|Roumanie|București|E',
    'BG|Bulgaria|Bulgaria|Bulgaria|Bulgaria|Bulgària|Bulgarie|Sofia|E', 'RU|Rusia|Russia|Errusia|Rusia|Rússia|Russie|Moskva|-', 'UA|Ucrania|Ukraine|Ukraina|Ucraína|Ucraïna|Ukraine|Kyiv|E',
    'TR|Turquía|Turkey|Turkia|Turquía|Turquia|Turquie|Ankara|-', 'HR|Croacia|Croatia|Kroazia|Croacia|Croàcia|Croatie|Zagreb|E', 'RS|Serbia|Serbia|Serbia|Serbia|Sèrbia|Serbie|Beograd|E',
    'SK|Eslovaquia|Slovakia|Eslovakia|Eslovaquia|Eslovàquia|Slovaquie|Bratislava|E', 'SI|Eslovenia|Slovenia|Eslovenia|Eslovenia|Eslovènia|Slovénie|Ljubljana|E', 'LT|Lituania|Lithuania|Lituania|Lituania|Lituània|Lituanie|Vilnius|E',
    'LV|Letonia|Latvia|Letonia|Letonia|Letònia|Lettonie|Rīga|E', 'EE|Estonia|Estonia|Estonia|Estonia|Estònia|Estonie|Tallinn|E', 'LU|Luxemburgo|Luxembourg|Luxenburgo|Luxemburgo|Luxemburg|Luxembourg|Luxembourg|E',
    'MT|Malta|Malta|Malta|Malta|Malta|Malte|Valletta|E', 'AD|Andorra|Andorra|Andorra|Andorra|Andorra|Andorre|Andorra la Vella|E', 'AL|Albania|Albania|Albania|Albania|Albània|Albanie|Tirana|E',
    'BA|Bosnia y Herzegovina|Bosnia and Herzegovina|Bosnia-Herzegovina|Bosnia e Hercegovina|Bòsnia i Hercegovina|Bosnie-Herzégovine|Sarajevo|E', 'MK|Macedonia del Norte|North Macedonia|Ipar Mazedonia|Macedonia do Norte|Macedònia del Nord|Macédoine du Nord|Skopje|E',
    'ME|Montenegro|Montenegro|Montenegro|Montenegro|Montenegro|Monténégro|Podgorica|E', 'MD|Moldavia|Moldova|Moldavia|Moldavia|Moldàvia|Moldavie|Chișinău|E', 'BY|Bielorrusia|Belarus|Bielorrusia|Bielorrusia|Bielorússia|Biélorussie|Minsk|E',
    'CN|China|China|Txina|China|Xina|Chine|Beijing|A', 'JP|Japón|Japan|Japonia|Xapón|Japó|Japon|Tokyo|A', 'IN|India|India|India|India|Índia|Inde|New Delhi|A',
    'KR|Corea del Sur|South Korea|Hego Korea|Corea do Sur|Corea del Sud|Corée du Sud|Seoul|A', 'TH|Tailandia|Thailand|Thailandia|Tailandia|Tailàndia|Thaïlande|Bangkok|A', 'VN|Vietnam|Vietnam|Vietnam|Vietnam|Vietnam|Viêt Nam|Hà Nội|A',
    'ID|Indonesia|Indonesia|Indonesia|Indonesia|Indonèsia|Indonésie|Jakarta|A', 'PH|Filipinas|Philippines|Filipinak|Filipinas|Filipines|Philippines|Manila|A', 'PK|Pakistán|Pakistan|Pakistan|Paquistán|Pakistan|Pakistan|Islamabad|A',
    'IR|Irán|Iran|Iran|Irán|Iran|Iran|Tehrān|A', 'IQ|Irak|Iraq|Irak|Iraq|Iraq|Irak|Baghdad|A', 'IL|Israel|Israel|Israel|Israel|Israel|Israël|-|A',
    'SA|Arabia Saudí|Saudi Arabia|Saudi Arabia|Arabia Saudita|Aràbia Saudita|Arabie saoudite|Riyadh|A', 'MN|Mongolia|Mongolia|Mongolia|Mongolia|Mongòlia|Mongolie|Ulaanbaatar|A', 'NP|Nepal|Nepal|Nepal|Nepal|Nepal|Népal|Kathmandu|A',
    'AF|Afganistán|Afghanistan|Afganistan|Afganistán|Afganistan|Afghanistan|Kabul|A', 'BD|Bangladés|Bangladesh|Bangladesh|Bangladesh|Bangladesh|Bangladesh|Dhaka|A', 'LK|Sri Lanka|Sri Lanka|Sri Lanka|Sri Lanka|Sri Lanka|Sri Lanka|-|A',
    'MY|Malasia|Malaysia|Malaysia|Malaisia|Malàisia|Malaisie|Kuala Lumpur|A', 'JO|Jordania|Jordan|Jordania|Xordania|Jordània|Jordanie|Amman|A', 'LB|Líbano|Lebanon|Libano|Líbano|Líban|Liban|Beirut|A',
    'SY|Siria|Syria|Siria|Siria|Síria|Syrie|Dimashq|A', 'AE|Emiratos Árabes Unidos|United Arab Emirates|Arabiar Emirerri Batuak|Emiratos Árabes Unidos|Emirats Àrabs Units|Émirats arabes unis|Abu Dhabi|A', 'KH|Camboya|Cambodia|Kanbodia|Camboia|Cambodja|Cambodge|Phnom Penh|A',
    'LA|Laos|Laos|Laos|Laos|Laos|Laos|Vientiane|A', 'MM|Birmania|Myanmar|Myanmar|Birmania|Birmània|Birmanie|Naypyidaw|A', 'KW|Kuwait|Kuwait|Kuwait|Kuwait|Kuwait|Koweït|Kuwait|A',
    'QA|Catar|Qatar|Qatar|Qatar|Qatar|Qatar|Doha|A', 'OM|Omán|Oman|Oman|Omán|Oman|Oman|Muscat|A', 'UZ|Uzbekistán|Uzbekistan|Uzbekistan|Uzbekistán|Uzbekistan|Ouzbékistan|Tashkent|A',
    'EG|Egipto|Egypt|Egipto|Exipto|Egipte|Égypte|Cairo|F', 'MA|Marruecos|Morocco|Maroko|Marrocos|Marroc|Maroc|Rabat|F', 'DZ|Argelia|Algeria|Aljeria|Alxeria|Algèria|Algérie|Alger|F',
    'TN|Túnez|Tunisia|Tunisia|Tunisia|Tunísia|Tunisie|Tunis|F', 'NG|Nigeria|Nigeria|Nigeria|Nixeria|Nigèria|Nigéria|Abuja|F', 'ZA|Sudáfrica|South Africa|Hegoafrika|Sudáfrica|Sud-àfrica|Afrique du Sud|-|F',
    'KE|Kenia|Kenya|Kenya|Quenia|Kenya|Kenya|Nairobi|F', 'ET|Etiopía|Ethiopia|Etiopia|Etiopía|Etiòpia|Éthiopie|Addis Ababa|F', 'GH|Ghana|Ghana|Ghana|Ghana|Ghana|Ghana|Accra|F',
    'SN|Senegal|Senegal|Senegal|Senegal|Senegal|Sénégal|Dakar|F', 'CM|Camerún|Cameroon|Kamerun|Camerún|Camerun|Cameroun|Yaoundé|F', 'CI|Costa de Marfil|Ivory Coast|Boli Kosta|Costa de Marfil|Costa d\'Ivori|Côte d\'Ivoire|-|F',
    'AO|Angola|Angola|Angola|Angola|Angola|Angola|Luanda|F', 'MZ|Mozambique|Mozambique|Mozambike|Mozambique|Moçambic|Mozambique|Maputo|F', 'TZ|Tanzania|Tanzania|Tanzania|Tanzania|Tanzània|Tanzanie|Dodoma|F',
    'UG|Uganda|Uganda|Uganda|Uganda|Uganda|Ouganda|Kampala|F', 'LY|Libia|Libya|Libia|Libia|Líbia|Libye|Tripoli|F', 'ML|Malí|Mali|Mali|Malí|Mali|Mali|Bamako|F',
    'MG|Madagascar|Madagascar|Madagaskar|Madagascar|Madagascar|Madagascar|Antananarivo|F', 'SD|Sudán|Sudan|Sudan|Sudán|Sudan|Soudan|Khartoum|F', 'ZM|Zambia|Zambia|Zambia|Zambia|Zàmbia|Zambie|Lusaka|F',
    'ZW|Zimbabue|Zimbabwe|Zimbabwe|Zimbabue|Zimbàbue|Zimbabwe|Harare|F', 'CD|RD del Congo|DR Congo|Kongoko Errepublika Demokratikoa|RD do Congo|RD del Congo|RD Congo|Kinshasa|F', 'NA|Namibia|Namibia|Namibia|Namibia|Namíbia|Namibie|Windhoek|F',
    'BW|Botsuana|Botswana|Botswana|Botsuana|Botswana|Botswana|Gaborone|F', 'RW|Ruanda|Rwanda|Ruanda|Ruanda|Ruanda|Rwanda|Kigali|F',
    'US|Estados Unidos|United States|Estatu Batuak|Estados Unidos|Estats Units|États-Unis|Washington|M', 'CA|Canadá|Canada|Kanada|Canadá|Canadà|Canada|Ottawa|M', 'MX|México|Mexico|Mexiko|México|Mèxic|Mexique|Ciudad de México|M',
    'CU|Cuba|Cuba|Kuba|Cuba|Cuba|Cuba|La Habana|M', 'BR|Brasil|Brazil|Brasil|Brasil|Brasil|Brésil|Brasília|M', 'AR|Argentina|Argentina|Argentina|Arxentina|Argentina|Argentine|Buenos Aires|M',
    'CL|Chile|Chile|Txile|Chile|Xile|Chili|Santiago|M', 'PE|Perú|Peru|Peru|Perú|Perú|Pérou|Lima|M', 'CO|Colombia|Colombia|Kolonbia|Colombia|Colòmbia|Colombie|Bogotá|M',
    'VE|Venezuela|Venezuela|Venezuela|Venezuela|Veneçuela|Venezuela|Caracas|M', 'UY|Uruguay|Uruguay|Uruguai|Uruguai|Uruguai|Uruguay|Montevideo|M', 'PY|Paraguay|Paraguay|Paraguai|Paraguai|Paraguai|Paraguay|Asunción|M',
    'BO|Bolivia|Bolivia|Bolivia|Bolivia|Bolívia|Bolivie|-|M', 'EC|Ecuador|Ecuador|Ekuador|Ecuador|Equador|Équateur|Quito|M', 'PA|Panamá|Panama|Panama|Panamá|Panamà|Panama|Panamá|M',
    'CR|Costa Rica|Costa Rica|Costa Rica|Costa Rica|Costa Rica|Costa Rica|San José|M', 'DO|República Dominicana|Dominican Republic|Dominikar Errepublika|República Dominicana|República Dominicana|République dominicaine|Santo Domingo|M', 'GT|Guatemala|Guatemala|Guatemala|Guatemala|Guatemala|Guatemala|Ciudad de Guatemala|M',
    'HN|Honduras|Honduras|Honduras|Honduras|Hondures|Honduras|Tegucigalpa|M', 'NI|Nicaragua|Nicaragua|Nikaragua|Nicaragua|Nicaragua|Nicaragua|Managua|M', 'SV|El Salvador|El Salvador|El Salvador|O Salvador|El Salvador|Salvador|San Salvador|M',
    'JM|Jamaica|Jamaica|Jamaika|Xamaica|Jamaica|Jamaïque|Kingston|M', 'HT|Haití|Haiti|Haiti|Haití|Haití|Haïti|Port-au-Prince|M',
    'AU|Australia|Australia|Australia|Australia|Austràlia|Australie|Canberra|O', 'NZ|Nueva Zelanda|New Zealand|Zeelanda Berria|Nova Zelandia|Nova Zelanda|Nouvelle-Zélande|Wellington|O', 'FJ|Fiyi|Fiji|Fiji|Fixi|Fiji|Fidji|Suva|O',
    'PG|Papúa Nueva Guinea|Papua New Guinea|Papua Ginea Berria|Papúa Nova Guinea|Papua Nova Guinea|Papouasie-Nouvelle-Guinée|Port Moresby|O'
  ];
  var C = rows.map(function (r) {
    var p = r.split('|');
    return { iso: p[0], name: L(p[1], p[2], p[3], p[4], p[5], p[6]), cap: p[7], cont: p[8] };
  });
  var byIso = {};
  C.forEach(function (c) { byIso[c.iso] = c; });
  var flag = function (iso) { return String.fromCodePoint(0x1F1E6 + iso.charCodeAt(0) - 65, 0x1F1E6 + iso.charCodeAt(1) - 65); };

  // 1. Capitals
  var caps = [];
  C.forEach(function (c) { if (c.cap !== '-') caps.push({ id: 'cap_' + c.iso, q: c.name, a: c.cap, tag: c.cont }); });
  D.push({
    id: 'world-capitals', icon: '🏙️',
    title: L('Capitales del mundo', 'World capitals', 'Munduko hiriburuak', 'Capitais do mundo', 'Capitals del món', 'Capitales du monde'),
    desc: L('La capital de unos 120 países', 'The capital of about 120 countries', 'Gutxi gorabehera 120 herrialdetako hiriburua', 'A capital de uns 120 países', 'La capital d\'uns 120 països', 'La capitale d\'environ 120 pays'),
    age: '8+', cards: caps
  });

  // 2. Continents
  var cn = {
    E: P('Europa|Europe|Europa|Europa|Europa|Europe'), A: P('Asia|Asia|Asia|Asia|Àsia|Asie'), F: P('África|Africa|Afrika|África|Àfrica|Afrique'),
    M: P('América|America|Amerika|América|Amèrica|Amérique'), O: P('Oceanía|Oceania|Ozeania|Oceanía|Oceania|Océanie')
  };
  var conts = [];
  C.forEach(function (c) {
    if (c.cont === '-') return;
    var others = Object.keys(cn).filter(function (k) { return k !== c.cont; });
    conts.push({ id: 'ct_' + c.iso, q: c.name, a: cn[c.cont], opts: others.map(function (k) { return cn[k]; }), tag: 'continents' });
  });
  D.push({
    id: 'world-continents', icon: '🌍',
    title: L('Países y continentes', 'Countries and continents', 'Herrialdeak eta kontinenteak', 'Países e continentes', 'Països i continents', 'Pays et continents'),
    desc: L('¿En qué continente está cada país?', 'Which continent is each country in?', 'Zein kontinentetan dago herrialde bakoitza?', 'En que continente está cada país?', 'En quin continent és cada país?', 'Sur quel continent se trouve chaque pays ?'),
    age: '7+', cards: conts
  });

  // 3. Flags
  var flagIso = ['ES', 'FR', 'GB', 'IT', 'DE', 'PT', 'AT', 'BE', 'NL', 'CH', 'IE', 'NO', 'SE', 'FI', 'DK', 'IS', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'RU', 'UA', 'TR', 'HR',
    'CN', 'JP', 'IN', 'KR', 'TH', 'VN', 'ID', 'PH', 'PK', 'IR', 'IL', 'SA', 'EG', 'MA', 'DZ', 'NG', 'ZA', 'KE', 'ET', 'GH', 'SN',
    'US', 'CA', 'MX', 'CU', 'BR', 'AR', 'CL', 'PE', 'CO', 'VE', 'UY', 'AU', 'NZ'];
  var flags = flagIso.map(function (i) { return { id: 'fl_' + i, q: flag(i), a: byIso[i].name, tag: byIso[i].cont }; });
  D.push({
    id: 'world-flags', icon: '🚩',
    title: L('Banderas del mundo', 'World flags', 'Munduko banderak', 'Bandeiras do mundo', 'Banderes del món', 'Drapeaux du monde'),
    desc: L('¿De qué país es esta bandera?', 'Which country does this flag belong to?', 'Zein herrialdetakoa da bandera hau?', 'De que país é esta bandeira?', 'De quin país és aquesta bandera?', 'De quel pays est ce drapeau ?'),
    age: '6+', cards: flags
  });

  // 4. Geography: oceans, rivers, mountains, records
  var geo = [];
  function g(id, q, a) { geo.push({ id: id, q: P(q), a: typeof a === 'string' && a.indexOf('|') > -1 ? P(a) : a, tag: 'geo' }); }
  g('o_big', 'El océano más grande|The largest ocean|Ozeanorik handiena|O océano máis grande|L\'oceà més gran|Le plus grand océan', 'Pacífico|Pacific|Ozeano Barea|Pacífico|Pacífic|Pacifique');
  g('o_eu_am', 'Océano entre Europa y América|Ocean between Europe and America|Europa eta Amerika artean dagoen ozeanoa|Océano entre Europa e América|Oceà entre Europa i Amèrica|Océan entre l\'Europe et l\'Amérique', 'Atlántico|Atlantic|Atlantikoa|Atlántico|Atlàntic|Atlantique');
  g('o_small', 'El océano más pequeño|The smallest ocean|Ozeanorik txikiena|O océano máis pequeno|L\'oceà més petit|Le plus petit océan', 'Ártico|Arctic|Artikoa|Ártico|Àrtic|Arctique');
  g('o_india', 'Océano que baña la India|Ocean that borders India|Indiaren ondoko ozeanoa|Océano que bañan a India|Oceà que banya l\'Índia|Océan qui borde l\'Inde', 'Índico|Indian|Indikoa|Índico|Índic|Indien');
  g('r_nile', 'Gran río de Egipto y de África|Great river of Egypt and Africa|Egiptoko eta Afrikako ibai handia|Gran río de Exipto e de África|Gran riu d\'Egipte i d\'Àfrica|Grand fleuve d\'Égypte et d\'Afrique', 'Nilo|Nile|Nilo|Nilo|Nil|Nil');
  g('r_amazon', 'El río más caudaloso del mundo|The river with the greatest flow in the world|Munduko ibai emaritsuena|O río máis caudaloso do mundo|El riu més cabalós del món|Le fleuve au plus fort débit du monde', 'Amazonas|Amazon|Amazonas|Amazonas|Amazones|Amazone');
  g('r_tajo', 'El río más largo de la península ibérica|The longest river of the Iberian Peninsula|Iberiar penintsulako ibairik luzeena|O río máis longo da península ibérica|El riu més llarg de la península Ibèrica|Le plus long fleuve de la péninsule ibérique', 'Tajo|Tagus|Tajo|Tallo|Tajo|Tage');
  g('r_ebro', 'Río que pasa por Zaragoza|River that flows through Zaragoza|Zaragozatik igarotzen den ibaia|Río que pasa por Zaragoza|Riu que passa per Saragossa|Fleuve qui traverse Saragosse', 'Ebro|Ebro|Ebro|Ebro|Ebre|Èbre');
  g('r_seine', 'Río que pasa por París|River that flows through Paris|Parisetik igarotzen den ibaia|Río que pasa por París|Riu que passa per París|Fleuve qui traverse Paris', 'Sena|Seine|Sena|Sena|Sena|Seine');
  g('r_thames', 'Río que pasa por Londres|River that flows through London|Londresetik igarotzen den ibaia|Río que pasa por Londres|Riu que passa per Londres|Fleuve qui traverse Londres', 'Támesis|Thames|Tamesis|Támese|Tàmesi|Tamise');
  g('r_tiber', 'Río que pasa por Roma|River that flows through Rome|Erromatik igarotzen den ibaia|Río que pasa por Roma|Riu que passa per Roma|Fleuve qui traverse Rome', 'Tíber|Tiber|Tibre|Tíber|Tíber|Tibre');
  g('r_nervion', 'Río que pasa por Bilbao|River that flows through Bilbao|Bilbotik igarotzen den ibaia|Río que pasa por Bilbao|Riu que passa per Bilbao|Fleuve qui traverse Bilbao', 'Nervión|Nervion|Nerbioi|Nervión|Nervión|Nervion');
  g('m_world', 'La montaña más alta del mundo|The highest mountain in the world|Munduko mendirik garaiena|A montaña máis alta do mundo|La muntanya més alta del món|La plus haute montagne du monde', 'Everest');
  g('m_spain', 'La montaña más alta de España|The highest mountain in Spain|Espainiako mendirik garaiena|A montaña máis alta de España|La muntanya més alta d\'Espanya|La plus haute montagne d\'Espagne', 'Teide');
  g('m_pen', 'La montaña más alta de la España peninsular|The highest mountain in mainland Spain|Espainia penintsularreko mendirik garaiena|A montaña máis alta da España peninsular|La muntanya més alta de l\'Espanya peninsular|La plus haute montagne d\'Espagne continentale', 'Mulhacén');
  g('m_africa', 'La montaña más alta de África|The highest mountain in Africa|Afrikako mendirik garaiena|A montaña máis alta de África|La muntanya més alta d\'Àfrica|La plus haute montagne d\'Afrique', 'Kilimanjaro');
  g('m_sam', 'La montaña más alta de América del Sur|The highest mountain in South America|Hego Amerikako mendirik garaiena|A montaña máis alta de América do Sur|La muntanya més alta d\'Amèrica del Sud|La plus haute montagne d\'Amérique du Sud', 'Aconcagua');
  g('m_nam', 'La montaña más alta de América del Norte|The highest mountain in North America|Ipar Amerikako mendirik garaiena|A montaña máis alta de América do Norte|La muntanya més alta d\'Amèrica del Nord|La plus haute montagne d\'Amérique du Nord', 'Denali');
  g('m_alps', 'La montaña más alta de los Alpes|The highest mountain in the Alps|Alpeetako mendirik garaiena|A montaña máis alta dos Alpes|La muntanya més alta dels Alps|La plus haute montagne des Alpes', 'Mont Blanc');
  g('m_pyr', 'La montaña más alta de los Pirineos|The highest mountain in the Pyrenees|Pirinioetako mendirik garaiena|A montaña máis alta dos Pireneos|La muntanya més alta dels Pirineus|La plus haute montagne des Pyrénées', 'Aneto');
  g('m_basque', 'La montaña más alta del País Vasco|The highest mountain in the Basque Country|Euskal Herriko mendirik garaiena (EAE)|A montaña máis alta do País Vasco|La muntanya més alta del País Basc|La plus haute montagne du Pays basque (CAV)', 'Aitxuri');
  g('m_range', 'Cordillera entre España y Francia|Mountain range between Spain and France|Espainia eta Frantzia arteko mendilerroa|Cordilleira entre España e Francia|Serralada entre Espanya i França|Chaîne de montagnes entre l\'Espagne et la France', 'Pirineos|Pyrenees|Pirinioak|Pireneos|Pirineus|Pyrénées');
  g('d_big', 'El mayor desierto cálido del mundo|The largest hot desert in the world|Munduko basamortu bero handiena|O maior deserto cálido do mundo|El desert càlid més gran del món|Le plus grand désert chaud du monde', 'Sáhara|Sahara|Sahara|Sáhara|Sàhara|Sahara');
  g('c_big', 'El país más grande del mundo por superficie|The largest country in the world by area|Munduko herrialderik handiena azaleraz|O país máis grande do mundo por superficie|El país més gran del món per superfície|Le plus grand pays du monde par sa superficie', byIso.RU.name);
  g('c_pop', 'El país con más habitantes del mundo|The most populous country in the world|Biztanle gehien dituen herrialdea|O país con máis habitantes do mundo|El país amb més habitants del món|Le pays le plus peuplé du monde', byIso.IN.name);
  g('c_small', 'El país más pequeño del mundo|The smallest country in the world|Munduko herrialderik txikiena|O país máis pequeno do mundo|El país més petit del món|Le plus petit pays du monde', 'Ciudad del Vaticano|Vatican City|Vatikano Hiria|Cidade do Vaticano|Ciutat del Vaticà|Cité du Vatican');
  g('i_big', 'La isla más grande del mundo|The largest island in the world|Munduko uharterik handiena|A illa máis grande do mundo|L\'illa més gran del món|La plus grande île du monde', 'Groenlandia|Greenland|Groenlandia|Groenlandia|Groenlàndia|Groenland');
  D.push({
    id: 'world-geography', icon: '🏔️',
    title: L('Océanos, ríos y montañas', 'Oceans, rivers and mountains', 'Ozeanoak, ibaiak eta mendiak', 'Océanos, ríos e montañas', 'Oceans, rius i muntanyes', 'Océans, fleuves et montagnes'),
    desc: L('Récords y lugares clave del planeta', 'Records and key places of the planet', 'Planetako errekorrak eta toki nagusiak', 'Récords e lugares clave do planeta', 'Rècords i llocs clau del planeta', 'Records et lieux clés de la planète'),
    age: '8+', cards: geo
  });

  // 5. Spanish autonomous communities
  var ccaa = [
    'Andalucía|Andalusia|Andaluzia|Andalucía|Andalusia|Andalousie|Sevilla', 'Aragón|Aragon|Aragoi|Aragón|Aragó|Aragon|Zaragoza', 'Asturias|Asturias|Asturias|Asturias|Astúries|Asturies|Oviedo',
    'Islas Baleares|Balearic Islands|Balear Uharteak|Illas Baleares|Illes Balears|Îles Baléares|Palma', 'Cantabria|Cantabria|Kantabria|Cantabria|Cantàbria|Cantabrie|Santander',
    'Castilla-La Mancha|Castilla-La Mancha|Gaztela-Mantxa|Castela-A Mancha|Castella - la Manxa|Castille-La Manche|Toledo', 'Castilla y León|Castile and León|Gaztela eta Leon|Castela e León|Castella i Lleó|Castille-et-León|Valladolid',
    'Cataluña|Catalonia|Katalunia|Cataluña|Catalunya|Catalogne|Barcelona', 'Comunidad Valenciana|Valencian Community|Valentziako Erkidegoa|Comunidade Valenciana|Comunitat Valenciana|Communauté valencienne|València',
    'Extremadura|Extremadura|Extremadura|Extremadura|Extremadura|Estrémadure|Mérida', 'Galicia|Galicia|Galizia|Galicia|Galícia|Galice|Santiago de Compostela', 'La Rioja|La Rioja|Errioxa|A Rioxa|La Rioja|La Rioja|Logroño',
    'Comunidad de Madrid|Community of Madrid|Madrilgo Erkidegoa|Comunidade de Madrid|Comunitat de Madrid|Communauté de Madrid|Madrid', 'Región de Murcia|Region of Murcia|Murtziako Eskualdea|Rexión de Murcia|Regió de Múrcia|Région de Murcie|Murcia',
    'Navarra|Navarre|Nafarroa|Navarra|Navarra|Navarre|Pamplona', 'País Vasco|Basque Country|Euskadi|País Vasco|País Basc|Pays basque|Vitoria-Gasteiz'
  ].map(function (r, i) {
    var p = r.split('|');
    return { id: 'cc' + (i + 1), q: L(p[0], p[1], p[2], p[3], p[4], p[5]), a: p[6], tag: 'spain' };
  });
  D.push({
    id: 'world-spain-ccaa', icon: '🇪🇸',
    title: L('Comunidades autónomas de España', 'Spanish autonomous communities', 'Espainiako autonomia-erkidegoak', 'Comunidades autónomas de España', 'Comunitats autònomes d\'Espanya', 'Communautés autonomes d\'Espagne'),
    desc: L('La capital de cada comunidad (sin Canarias, con dos capitales)', 'The capital of each community (Canary Islands left out: two capitals)', 'Erkidego bakoitzaren hiriburua (Kanariak kanpo: bi hiriburu)', 'A capital de cada comunidade (sen Canarias, con dúas capitais)', 'La capital de cada comunitat (sense Canàries, amb dues capitals)', 'La capitale de chaque communauté (sans les Canaries, deux capitales)'),
    age: '8+', cards: ccaa
  });

  // 6. Basque Country and Spain basics
  var eus = [];
  function e(id, q, a) { eus.push({ id: id, q: P(q), a: typeof a === 'string' && a.indexOf('|') > -1 ? P(a) : a, tag: 'basque' }); }
  e('b_alava', 'Capital de Álava|Capital of Álava|Arabako hiriburua|Capital de Álava|Capital d\'Àlaba|Capitale de l\'Alava', 'Vitoria-Gasteiz');
  e('b_gipuzkoa', 'Capital de Gipuzkoa|Capital of Gipuzkoa|Gipuzkoako hiriburua|Capital de Guipúscoa|Capital de Guipúscoa|Capitale du Guipuscoa', 'Donostia');
  e('b_bizkaia', 'Capital de Bizkaia|Capital of Biscay|Bizkaiko hiriburua|Capital de Biscaia|Capital de Biscaia|Capitale de la Biscaye', 'Bilbao');
  e('b_capital', 'Capital del País Vasco|Capital of the Basque Country|Euskadiko hiriburua|Capital do País Vasco|Capital del País Basc|Capitale du Pays basque (CAV)', 'Vitoria-Gasteiz');
  e('b_prov', 'Número de provincias del País Vasco|Number of provinces in the Basque Country|Euskadiko probintzia kopurua|Número de provincias do País Vasco|Nombre de províncies del País Basc|Nombre de provinces du Pays basque (CAV)', '3');
  e('b_lang', 'Lengua propia del País Vasco|Native language of the Basque Country|Euskal Herriko berezko hizkuntza|Lingua propia do País Vasco|Llengua pròpia del País Basc|Langue propre du Pays basque', 'Euskara');
  e('b_big', 'Ciudad más poblada del País Vasco|Most populous city in the Basque Country|Euskadiko hirik jendetsuena|Cidade máis poboada do País Vasco|Ciutat més poblada del País Basc|Ville la plus peuplée du Pays basque', 'Bilbao');
  e('s_cap', 'Capital de España|Capital of Spain|Espainiako hiriburua|Capital de España|Capital d\'Espanya|Capitale de l\'Espagne', 'Madrid');
  e('s_prov', 'Número de provincias de España|Number of provinces in Spain|Espainiako probintzia kopurua|Número de provincias de España|Nombre de províncies d\'Espanya|Nombre de provinces d\'Espagne', '50');
  e('s_ccaa', 'Número de comunidades autónomas de España|Number of autonomous communities in Spain|Espainiako autonomia-erkidegoen kopurua|Número de comunidades autónomas de España|Nombre de comunitats autònomes d\'Espanya|Nombre de communautés autonomes d\'Espagne', '17');
  D.push({
    id: 'world-basque-spain', icon: '⛰️',
    title: L('País Vasco y España: lo básico', 'Basque Country and Spain: the basics', 'Euskadi eta Espainia: oinarrizkoak', 'País Vasco e España: o básico', 'País Basc i Espanya: el bàsic', 'Pays basque et Espagne : les bases'),
    desc: L('Provincias, capitales y datos clave', 'Provinces, capitals and key facts', 'Probintziak, hiriburuak eta datu nagusiak', 'Provincias, capitais e datos clave', 'Províncies, capitals i dades clau', 'Provinces, capitales et données clés'),
    age: '7+', cards: eus
  });
})();
