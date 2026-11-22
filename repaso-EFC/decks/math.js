(function () {
  var D = (window.RepasoDecks = window.RepasoDecks || []);
  var L = function (es, en, eu, gl, ca, fr) { return { es: es, en: en, eu: eu, gl: gl, ca: ca, fr: fr }; };
  var i, j;

  // 1. Multiplication tables 2-10
  var mult = [];
  for (i = 2; i <= 10; i++) for (j = 2; j <= 10; j++) {
    mult.push({ id: 'm' + i + 'x' + j, q: i + ' x ' + j, a: String(i * j), tag: 'x' + i });
  }
  D.push({
    id: 'mates-tablas', icon: '✖️',
    title: L('Tablas de multiplicar', 'Multiplication tables', 'Biderketa-taulak', 'Táboas de multiplicar', 'Taules de multiplicar', 'Tables de multiplication'),
    desc: L('Las tablas del 2 al 10', 'Tables from 2 to 10', '2tik 10era bitarteko taulak', 'As táboas do 2 ao 10', 'Les taules del 2 al 10', 'Les tables de 2 à 10'),
    age: '6+', cards: mult
  });

  // 2. Complements
  var comp = [];
  for (i = 1; i <= 9; i++) comp.push({ id: 'c' + i + '_10', q: i + ' + ? = 10', a: String(10 - i), tag: '10' });
  for (i = 11; i <= 19; i++) comp.push({ id: 'c' + i + '_20', q: i + ' + ? = 20', a: String(20 - i), tag: '20' });
  [25, 60].forEach(function (n) { comp.push({ id: 'c' + n + '_100', q: n + ' + ? = 100', a: String(100 - n), tag: '100' }); });
  D.push({
    id: 'mates-complementos', icon: '➕',
    title: L('Sumas que hacen 10, 20 y 100', 'Sums that make 10, 20 and 100', '10, 20 eta 100 egiten dituzten batuketak', 'Sumas que fan 10, 20 e 100', 'Sumes que fan 10, 20 i 100', 'Additions qui font 10, 20 et 100'),
    desc: L('Qué número falta para llegar a 10, 20 o 100', 'Which number is missing to reach 10, 20 or 100', 'Zer zenbaki falta da 10, 20 edo 100era iristeko', 'Que número falta para chegar a 10, 20 ou 100', 'Quin nombre falta per arribar a 10, 20 o 100', 'Quel nombre manque pour arriver à 10, 20 ou 100'),
    age: '6+', cards: comp
  });

  // 3. Division facts
  var div = [];
  for (j = 2; j <= 9; j++) for (i = 2; i <= 6; i++) {
    div.push({ id: 'd' + (i * j) + 'by' + j, q: (i * j) + ' ÷ ' + j, a: String(i), tag: '÷' + j });
  }
  D.push({
    id: 'mates-divisiones', icon: '➗',
    title: L('Divisiones básicas', 'Basic division facts', 'Oinarrizko zatiketak', 'Divisións básicas', 'Divisions bàsiques', 'Divisions de base'),
    desc: L('Divisiones exactas del 2 al 9', 'Exact divisions by 2 to 9', '2tik 9ra bitarteko zatiketa zehatzak', 'Divisións exactas do 2 ao 9', 'Divisions exactes del 2 al 9', 'Divisions exactes par 2 à 9'),
    age: '7+', cards: div
  });

  // 4. Squares and cubes
  var pw = [];
  for (i = 1; i <= 15; i++) pw.push({ id: 'sq' + i, q: i + '²', a: String(i * i), tag: 'square' });
  for (i = 1; i <= 5; i++) pw.push({ id: 'cu' + i, q: i + '³', a: String(i * i * i), tag: 'cube' });
  D.push({
    id: 'mates-potencias', icon: '🔢',
    title: L('Cuadrados y cubos', 'Squares and cubes', 'Karratuak eta kuboak', 'Cadrados e cubos', 'Quadrats i cubs', 'Carrés et cubes'),
    desc: L('Cuadrados del 1 al 15 y cubos del 1 al 5', 'Squares from 1 to 15 and cubes from 1 to 5', 'Karratuak 1etik 15era eta kuboak 1etik 5era', 'Cadrados do 1 ao 15 e cubos do 1 ao 5', 'Quadrats de l\'1 al 15 i cubs de l\'1 al 5', 'Carrés de 1 à 15 et cubes de 1 à 5'),
    age: '9+', cards: pw
  });

  // 5. Roman numerals
  function roman(n) {
    var map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    var s = '';
    map.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s;
  }
  var rom = [];
  var nums = [];
  for (i = 1; i <= 30; i++) nums.push(i);
  nums = nums.concat([40, 50, 60, 70, 80, 90, 100, 400, 500, 1000]);
  nums.forEach(function (n) { rom.push({ id: 'r' + n, q: roman(n), a: String(n) }); });
  D.push({
    id: 'mates-romanos', icon: '🏛️',
    title: L('Números romanos', 'Roman numerals', 'Erromatar zenbakiak', 'Números romanos', 'Números romans', 'Chiffres romains'),
    desc: L('Del 1 al 30 y los números clave hasta 1000', 'From 1 to 30 and key numbers up to 1000', '1etik 30era eta 1000ra arteko zenbaki nagusiak', 'Do 1 ao 30 e os números clave ata 1000', 'De l\'1 al 30 i els nombres clau fins a 1000', 'De 1 à 30 et les nombres clés jusqu\'à 1000'),
    age: '8+', cards: rom
  });

  // 6. Geometry
  var shapes = {
    triangle: L('triángulo', 'triangle', 'triangelua', 'triángulo', 'triangle', 'triangle'),
    square: L('cuadrado', 'square', 'karratua', 'cadrado', 'quadrat', 'carré'),
    rectangle: L('rectángulo', 'rectangle', 'laukizuzena', 'rectángulo', 'rectangle', 'rectangle'),
    pentagon: L('pentágono', 'pentagon', 'pentagonoa', 'pentágono', 'pentàgon', 'pentagone'),
    hexagon: L('hexágono', 'hexagon', 'hexagonoa', 'hexágono', 'hexàgon', 'hexagone'),
    heptagon: L('heptágono', 'heptagon', 'heptagonoa', 'heptágono', 'heptàgon', 'heptagone'),
    octagon: L('octógono', 'octagon', 'oktogonoa', 'octógono', 'octògon', 'octogone'),
    decagon: L('decágono', 'decagon', 'dekagonoa', 'decágono', 'decàgon', 'décagone'),
    cube: L('cubo', 'cube', 'kuboa', 'cubo', 'cub', 'cube'),
    tetra: L('tetraedro', 'tetrahedron', 'tetraedroa', 'tetraedro', 'tetràedre', 'tétraèdre'),
    pyr: L('pirámide cuadrada', 'square pyramid', 'oinarri karratuko piramidea', 'pirámide cuadrada', 'piràmide quadrada', 'pyramide à base carrée'),
    octa: L('octaedro', 'octahedron', 'oktaedroa', 'octaedro', 'octàedre', 'octaèdre')
  };
  var pre = {
    sides: L('Lados:', 'Sides:', 'Aldeak:', 'Lados:', 'Costats:', 'Côtés :'),
    faces: L('Caras:', 'Faces:', 'Aurpegiak:', 'Caras:', 'Cares:', 'Faces :'),
    verts: L('Vértices:', 'Vertices:', 'Erpinak:', 'Vértices:', 'Vèrtexs:', 'Sommets :')
  };
  var geo = [];
  function g(kind, key, n) {
    var q = {};
    Object.keys(pre[kind]).forEach(function (l) { q[l] = pre[kind][l] + ' ' + shapes[key][l]; });
    geo.push({ id: 'g' + kind + '_' + key, q: q, a: String(n), tag: kind });
  }
  [['triangle', 3], ['square', 4], ['rectangle', 4], ['pentagon', 5], ['hexagon', 6], ['heptagon', 7], ['octagon', 8], ['decagon', 10]].forEach(function (p) { g('sides', p[0], p[1]); });
  [['cube', 6], ['tetra', 4], ['pyr', 5], ['octa', 8]].forEach(function (p) { g('faces', p[0], p[1]); });
  [['cube', 8], ['tetra', 4], ['pyr', 5], ['octa', 6]].forEach(function (p) { g('verts', p[0], p[1]); });
  geo.push({ id: 'gang_tri', q: L('Suma de los ángulos de un triángulo (grados)', 'Sum of the angles of a triangle (degrees)', 'Triangelu baten angeluen batura (graduak)', 'Suma dos ángulos dun triángulo (graos)', 'Suma dels angles d\'un triangle (graus)', 'Somme des angles d\'un triangle (degrés)'), a: '180', tag: 'angles' });
  geo.push({ id: 'gang_quad', q: L('Suma de los ángulos de un cuadrado (grados)', 'Sum of the angles of a square (degrees)', 'Karratu baten angeluen batura (graduak)', 'Suma dos ángulos dun cadrado (graos)', 'Suma dels angles d\'un quadrat (graus)', 'Somme des angles d\'un carré (degrés)'), a: '360', tag: 'angles' });
  geo.push({ id: 'gang_right', q: L('Grados de un ángulo recto', 'Degrees of a right angle', 'Angelu zuzen baten graduak', 'Graos dun ángulo recto', 'Graus d\'un angle recte', 'Degrés d\'un angle droit'), a: '90', tag: 'angles' });
  geo.push({ id: 'gang_flat', q: L('Grados de un ángulo llano', 'Degrees of a straight angle', 'Angelu lau baten graduak', 'Graos dun ángulo raso', 'Graus d\'un angle pla', 'Degrés d\'un angle plat'), a: '180', tag: 'angles' });
  D.push({
    id: 'mates-geometria', icon: '📐',
    title: L('Geometría básica', 'Basic geometry', 'Oinarrizko geometria', 'Xeometría básica', 'Geometria bàsica', 'Géométrie de base'),
    desc: L('Lados, caras, vértices y ángulos', 'Sides, faces, vertices and angles', 'Aldeak, aurpegiak, erpinak eta angeluak', 'Lados, caras, vértices e ángulos', 'Costats, cares, vèrtexs i angles', 'Côtés, faces, sommets et angles'),
    age: '7+', cards: geo
  });
})();
