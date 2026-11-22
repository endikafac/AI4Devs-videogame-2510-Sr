/**
 * Crossword - Extra clues (8 new categories, 6 languages each).
 * Row: [category, WORD (A-Z), display, emoji, es, en, eu, gl, ca, fr]
 * Merged into CW_CLUES at load time (see bottom). Words without accents or Ñ.
 */
(function () {
    const rows = [
        // ── CUERPO ────────────────────────────────────────────────
        ['cuerpo', 'CORAZON', 'corazón', '🫀', 'Órgano que bombea la sangre', 'Organ that pumps blood', 'Odola ponpatzen duen organoa', 'Órgano que bombea o sangue', 'Òrgan que bombeja la sang', 'Organe qui pompe le sang'],
        ['cuerpo', 'PULMON', 'pulmón', '🫁', 'Órgano con el que respiramos', 'Organ we breathe with', 'Arnasa hartzeko organoa', 'Órgano co que respiramos', 'Òrgan amb què respirem', 'Organe avec lequel on respire'],
        ['cuerpo', 'CEREBRO', 'cerebro', '🧠', 'Órgano que controla el pensamiento', 'Organ that controls thinking', 'Pentsamendua kontrolatzen duen organoa', 'Órgano que controla o pensamento', 'Òrgan que controla el pensament', 'Organe qui contrôle la pensée'],
        ['cuerpo', 'ESTOMAGO', 'estómago', '🍽️', 'Bolsa donde se digieren los alimentos', 'Pouch where food is digested', 'Janaria digeritzen den poltsa', 'Bolsa onde se dixiren os alimentos', 'Bossa on es digereixen els aliments', 'Poche où les aliments sont digérés'],
        ['cuerpo', 'HUESO', 'hueso', '🦴', 'Pieza dura del esqueleto', 'Hard piece of the skeleton', 'Eskeletoaren pieza gogorra', 'Peza dura do esqueleto', "Peça dura de l'esquelet", 'Pièce dure du squelette'],
        ['cuerpo', 'MUSCULO', 'músculo', '💪', 'Tejido que permite mover el cuerpo', 'Tissue that lets the body move', 'Gorputza mugitzeko ehuna', 'Tecido que permite mover o corpo', 'Teixit que permet moure el cos', 'Tissu qui permet de bouger le corps'],
        ['cuerpo', 'OREJA', 'oreja', '👂', 'Parte externa del oído', 'Outer part of the ear', 'Belarriaren kanpoko zatia', 'Parte externa do oído', "Part externa de l'orella", "Partie externe de l'oreille"],
        ['cuerpo', 'NARIZ', 'nariz', '👃', 'Órgano del olfato', 'Organ of smell', 'Usainaren organoa', 'Órgano do olfacto', "Òrgan de l'olfacte", "Organe de l'odorat"],
        ['cuerpo', 'DIENTE', 'diente', '🦷', 'Pieza dura de la boca para masticar', 'Hard piece in the mouth for chewing', 'Aho barruko pieza gogorra, murtxikatzeko', 'Peza dura da boca para mastigar', 'Peça dura de la boca per mastegar', 'Pièce dure de la bouche pour mâcher'],
        ['cuerpo', 'RODILLA', 'rodilla', '🦵', 'Articulación entre muslo y pierna', 'Joint between thigh and leg', 'Izterraren eta hankaren arteko giltza', 'Articulación entre coxa e perna', 'Articulació entre la cuixa i la cama', 'Articulation entre la cuisse et la jambe'],
        ['cuerpo', 'HIGADO', 'hígado', '🫀', 'Gran órgano que limpia la sangre', 'Large organ that cleans the blood', 'Odola garbitzen duen organo handia', 'Gran órgano que limpa o sangue', 'Gran òrgan que neteja la sang', 'Grand organe qui nettoie le sang'],
        ['cuerpo', 'PIEL', 'piel', '🖐️', 'Capa que cubre todo el cuerpo', 'Layer covering the whole body', 'Gorputz osoa estaltzen duen geruza', 'Capa que cobre todo o corpo', 'Capa que cobreix tot el cos', 'Couche qui recouvre tout le corps'],

        // ── OFICIOS ───────────────────────────────────────────────
        ['oficios', 'MEDICO', 'médico', '🧑‍⚕️', 'Profesional que cura a los enfermos', 'Professional who treats the sick', 'Gaixoak sendatzen dituen profesionala', 'Profesional que cura os enfermos', 'Professional que cura els malalts', 'Professionnel qui soigne les malades'],
        ['oficios', 'PILOTO', 'piloto', '🧑‍✈️', 'Persona que conduce un avión', 'Person who flies a plane', 'Hegazkina gidatzen duen pertsona', 'Persoa que conduce un avión', 'Persona que condueix un avió', 'Personne qui conduit un avion'],
        ['oficios', 'COCINERO', 'cocinero', '🧑‍🍳', 'Persona que prepara comidas', 'Person who prepares meals', 'Otordu prestatzen dituen pertsona', 'Persoa que prepara comidas', 'Persona que prepara menjars', 'Personne qui prépare les repas'],
        ['oficios', 'BOMBERO', 'bombero', '🧑‍🚒', 'Apaga los incendios', 'Puts out fires', 'Suteak itzaltzen ditu', 'Apaga os incendios', 'Apaga els incendis', 'Éteint les incendies'],
        ['oficios', 'MAESTRO', 'maestro', '🧑‍🏫', 'Enseña en la escuela', 'Teaches at school', 'Eskolan irakasten du', 'Ensina na escola', "Ensenya a l'escola", "Enseigne à l'école"],
        ['oficios', 'PINTOR', 'pintor', '🧑‍🎨', 'Crea cuadros con colores', 'Creates paintings with colours', 'Koloreekin koadroak sortzen ditu', 'Crea cadros con cores', 'Crea quadres amb colors', 'Crée des tableaux avec des couleurs'],
        ['oficios', 'POLICIA', 'policía', '👮', 'Vela por la seguridad ciudadana', 'Keeps citizens safe', 'Herritarren segurtasuna zaintzen du', 'Vela pola seguridade cidadá', 'Vetlla per la seguretat ciutadana', 'Veille à la sécurité des citoyens'],
        ['oficios', 'GRANJERO', 'granjero', '🧑‍🌾', 'Cuida animales y cultivos en la granja', 'Looks after animals and crops on the farm', 'Baserrian animaliak eta laboreak zaintzen ditu', 'Coida animais e cultivos na granxa', 'Cuida animals i cultius a la granja', 'Soigne animaux et cultures à la ferme'],
        ['oficios', 'CARTERO', 'cartero', '📮', 'Reparte las cartas', 'Delivers the letters', 'Gutunak banatzen ditu', 'Reparte as cartas', 'Reparteix les cartes', 'Distribue les lettres'],
        ['oficios', 'DENTISTA', 'dentista', '🦷', 'Cuida los dientes', 'Takes care of teeth', 'Hortzak zaintzen ditu', 'Coida os dentes', 'Cuida les dents', 'Prend soin des dents'],
        ['oficios', 'CARPINTERO', 'carpintero', '🪚', 'Trabaja la madera', 'Works with wood', 'Egurra lantzen du', 'Traballa a madeira', 'Treballa la fusta', 'Travaille le bois'],
        ['oficios', 'ARQUITECTO', 'arquitecto', '📐', 'Diseña edificios', 'Designs buildings', 'Eraikinak diseinatzen ditu', 'Deseña edificios', 'Dissenya edificis', 'Conçoit des bâtiments'],

        // ── TRANSPORTE ────────────────────────────────────────────
        ['transporte', 'TREN', 'tren', '🚆', 'Vehículo que circula sobre raíles', 'Vehicle that runs on rails', 'Trenbideetan ibiltzen den ibilgailua', 'Vehículo que circula sobre carrís', 'Vehicle que circula sobre rails', 'Véhicule qui roule sur des rails'],
        ['transporte', 'BARCO', 'barco', '🚢', 'Navega por el agua', 'Sails on water', 'Uretan nabigatzen du', 'Navega pola auga', "Navega per l'aigua", "Navigue sur l'eau"],
        ['transporte', 'AVION', 'avión', '✈️', 'Vuela con alas y motores', 'Flies with wings and engines', 'Hegalekin eta motorrekin hegan egiten du', 'Voa con ás e motores', 'Vola amb ales i motors', 'Vole avec des ailes et des moteurs'],
        ['transporte', 'BICICLETA', 'bicicleta', '🚲', 'Dos ruedas y pedales', 'Two wheels and pedals', 'Bi gurpil eta pedalak', 'Dúas rodas e pedais', 'Dues rodes i pedals', 'Deux roues et des pédales'],
        ['transporte', 'AUTOBUS', 'autobús', '🚌', 'Transporte público de calle con muchas plazas', 'Large public road transport', 'Kaleko garraio publiko handia', 'Transporte público de rúa con moitas prazas', 'Transport públic de carrer amb moltes places', 'Grand transport public routier'],
        ['transporte', 'METRO', 'metro', '🚇', 'Tren subterráneo urbano', 'Underground urban train', 'Hiriko lurpeko trena', 'Tren subterráneo urbano', 'Tren subterrani urbà', 'Train urbain souterrain'],
        ['transporte', 'CAMION', 'camión', '🚚', 'Vehículo grande para llevar mercancías', 'Large vehicle for carrying goods', 'Salgaiak eramateko ibilgailu handia', 'Vehículo grande para levar mercadorías', 'Vehicle gran per portar mercaderies', 'Grand véhicule pour transporter des marchandises'],
        ['transporte', 'MOTO', 'moto', '🏍️', 'Vehículo de dos ruedas con motor', 'Two-wheeled vehicle with an engine', 'Motorra duen bi gurpileko ibilgailua', 'Vehículo de dúas rodas con motor', 'Vehicle de dues rodes amb motor', 'Véhicule à deux roues avec moteur'],
        ['transporte', 'TRANVIA', 'tranvía', '🚋', 'Vehículo eléctrico urbano sobre carriles', 'Electric city vehicle on tracks', 'Hiriko ibilgailu elektrikoa, bideetan', 'Vehículo eléctrico urbano sobre carrís', 'Vehicle elèctric urbà sobre carrils', 'Véhicule électrique urbain sur rails'],
        ['transporte', 'HELICOPTERO', 'helicóptero', '🚁', 'Vuela con hélices en la parte superior', 'Flies with rotors on top', 'Goiko helizeekin hegan egiten du', 'Voa con hélices na parte superior', 'Vola amb hèlixs a la part superior', 'Vole avec des hélices sur le dessus'],
        ['transporte', 'CANOA', 'canoa', '🛶', 'Barca ligera que se mueve con remo', 'Light boat moved with a paddle', 'Arraun batekin mugitzen den txalupa arina', 'Barca lixeira que se move con remo', 'Barca lleugera que es mou amb rem', 'Bateau léger qui avance à la pagaie'],
        ['transporte', 'PATINETE', 'patinete', '🛴', 'Se impulsa con un pie sobre una tabla con ruedas', 'You push it with one foot on a board with wheels', 'Oin batekin bultzatzen da, gurpildun taula batean', 'Impúlsase cun pé sobre unha táboa con rodas', 'Es propulsa amb un peu sobre una taula amb rodes', "On le pousse d'un pied sur une planche à roues"],

        // ── MUSICA ────────────────────────────────────────────────
        ['musica', 'GUITARRA', 'guitarra', '🎸', 'Instrumento de cuerdas que se rasguea', 'String instrument that is strummed', 'Korda-instrumentua, jotzen dena', 'Instrumento de cordas que se rasga', 'Instrument de corda que es rasqueja', 'Instrument à cordes que l’on gratte'],
        ['musica', 'PIANO', 'piano', '🎹', 'Instrumento de teclas blancas y negras', 'Instrument with black and white keys', 'Tekla zuri eta beltzeko instrumentua', 'Instrumento de teclas brancas e negras', 'Instrument de tecles blanques i negres', 'Instrument à touches noires et blanches'],
        ['musica', 'VIOLIN', 'violín', '🎻', 'Instrumento de cuerda frotada con arco', 'String instrument played with a bow', 'Arkuarekin jotzen den korda-instrumentua', 'Instrumento de corda fregada con arco', 'Instrument de corda fregada amb arquet', 'Instrument à cordes frottées avec un archet'],
        ['musica', 'TAMBOR', 'tambor', '🥁', 'Instrumento de percusión que se golpea', 'Percussion instrument that is struck', 'Kolpatzen den perkusio-instrumentua', 'Instrumento de percusión que se golpea', 'Instrument de percussió que es colpeja', 'Instrument de percussion que l’on frappe'],
        ['musica', 'FLAUTA', 'flauta', '🪈', 'Instrumento de viento alargado', 'Long wind instrument', 'Haize-instrumentu luzea', 'Instrumento de vento alongado', 'Instrument de vent allargat', 'Long instrument à vent'],
        ['musica', 'TROMPETA', 'trompeta', '🎺', 'Instrumento de viento de metal', 'Brass wind instrument', 'Metalezko haize-instrumentua', 'Instrumento de vento de metal', 'Instrument de vent de metall', 'Instrument à vent en cuivre'],
        ['musica', 'ARPA', 'arpa', '🎼', 'Instrumento de muchas cuerdas verticales', 'Instrument with many vertical strings', 'Korda bertikal askoko instrumentua', 'Instrumento de moitas cordas verticais', 'Instrument de moltes cordes verticals', 'Instrument à nombreuses cordes verticales'],
        ['musica', 'MELODIA', 'melodía', '🎶', 'Sucesión de notas que forma una tonada', 'Sequence of notes forming a tune', 'Doinua osatzen duten notak', 'Sucesión de notas que forma unha tonada', 'Successió de notes que forma una tonada', 'Suite de notes formant un air'],
        ['musica', 'RITMO', 'ritmo', '🪘', 'Orden de los sonidos en el tiempo', 'Order of sounds in time', 'Soinuen ordena denboran', 'Orde dos sons no tempo', 'Ordre dels sons en el temps', 'Ordre des sons dans le temps'],
        ['musica', 'CORO', 'coro', '🎤', 'Grupo de personas que cantan juntas', 'Group of people singing together', 'Elkarrekin kantatzen duen taldea', 'Grupo de persoas que cantan xuntas', 'Grup de persones que canten juntes', 'Groupe de personnes qui chantent ensemble'],
        ['musica', 'NOTA', 'nota', '🎵', 'Signo que representa un sonido', 'Sign representing a sound', 'Soinu bat adierazten duen zeinua', 'Signo que representa un son', 'Signe que representa un so', 'Signe qui représente un son'],
        ['musica', 'ORQUESTA', 'orquesta', '🎼', 'Gran conjunto de instrumentistas', 'Large group of instrument players', 'Musikari talde handia', 'Gran conxunto de instrumentistas', "Gran conjunt d'instrumentistes", "Grand ensemble d'instrumentistes"],

        // ── MATEMATICAS ───────────────────────────────────────────
        ['matematicas', 'SUMA', 'suma', '➕', 'Operación de juntar cantidades', 'Operation of adding quantities', 'Kopuruak batzeko eragiketa', 'Operación de xuntar cantidades', 'Operació de ajuntar quantitats', 'Opération qui réunit des quantités'],
        ['matematicas', 'RESTA', 'resta', '➖', 'Operación de quitar una cantidad a otra', 'Operation of taking one quantity from another', 'Kopuru bati beste bat kentzeko eragiketa', 'Operación de quitar unha cantidade a outra', 'Operació de treure una quantitat a una altra', 'Opération qui retire une quantité à une autre'],
        ['matematicas', 'DIVISION', 'división', '➗', 'Reparte una cantidad en partes iguales', 'Splits a quantity into equal parts', 'Kopuru bat zati berdinetan banatzen du', 'Reparte unha cantidade en partes iguais', 'Reparteix una quantitat en parts iguals', 'Partage une quantité en parts égales'],
        ['matematicas', 'CIRCULO', 'círculo', '⭕', 'Figura redonda y plana', 'Round flat shape', 'Forma biribil eta laua', 'Figura redonda e plana', 'Figura rodona i plana', 'Figure ronde et plate'],
        ['matematicas', 'TRIANGULO', 'triángulo', '🔺', 'Polígono de tres lados', 'Polygon with three sides', 'Hiru aldeko poligonoa', 'Polígono de tres lados', 'Polígon de tres costats', 'Polygone à trois côtés'],
        ['matematicas', 'CUADRADO', 'cuadrado', '🟦', 'Figura con cuatro lados iguales', 'Shape with four equal sides', 'Lau alde berdineko irudia', 'Figura con catro lados iguais', 'Figura amb quatre costats iguals', 'Figure à quatre côtés égaux'],
        ['matematicas', 'ANGULO', 'ángulo', '📐', 'Abertura entre dos líneas que se cortan', 'Opening between two crossing lines', 'Elkar mozten diren bi lerroren arteko irekiera', 'Abertura entre dúas liñas que se cortan', 'Obertura entre dues línies que es tallen', 'Ouverture entre deux lignes qui se coupent'],
        ['matematicas', 'FRACCION', 'fracción', '½', 'Número que expresa una parte del todo', 'Number expressing part of a whole', 'Osotik zati bat adierazten duen zenbakia', 'Número que expresa unha parte do todo', 'Nombre que expressa una part del tot', 'Nombre qui exprime une partie du tout'],
        ['matematicas', 'DECIMAL', 'decimal', '🔢', 'Número con coma y cifras tras ella', 'Number with a point and digits after it', 'Koma eta ondoren zifrak dituen zenbakia', 'Número con coma e cifras despois dela', 'Nombre amb coma i xifres després', 'Nombre avec une virgule et des chiffres après'],
        ['matematicas', 'CERO', 'cero', '0️⃣', 'Número que significa ninguna cantidad', 'Number meaning no quantity', 'Kantitaterik ez esan nahi duen zenbakia', 'Número que significa ningunha cantidade', 'Nombre que significa cap quantitat', 'Nombre qui signifie aucune quantité'],
        ['matematicas', 'PERIMETRO', 'perímetro', '📏', 'Longitud total del contorno de una figura', 'Total length around a shape', 'Irudi baten ingurunearen luzera osoa', 'Lonxitude total do contorno dunha figura', "Longitud total del contorn d'una figura", "Longueur totale du contour d'une figure"],
        ['matematicas', 'GRAFICO', 'gráfico', '📊', 'Dibujo que representa datos', 'Drawing that represents data', 'Datuak adierazten dituen marrazkia', 'Debuxo que representa datos', 'Dibuix que representa dades', 'Dessin qui représente des données'],

        // ── HOGAR ─────────────────────────────────────────────────
        ['hogar', 'SOFA', 'sofá', '🛋️', 'Asiento mullido para varias personas', 'Soft seat for several people', 'Hainbat pertsonarentzako eserleku bigun', 'Asento macio para varias persoas', 'Seient tou per a diverses persones', 'Siège moelleux pour plusieurs personnes'],
        ['hogar', 'MESA', 'mesa', '🪑', 'Mueble con patas para comer o escribir', 'Furniture with legs for eating or writing', 'Jateko edo idazteko hankadun altzaria', 'Moble con patas para comer ou escribir', 'Moble amb potes per menjar o escriure', 'Meuble à pieds pour manger ou écrire'],
        ['hogar', 'SILLA', 'silla', '🪑', 'Asiento con respaldo para una persona', 'Seat with a back for one person', 'Pertsona bakarrarentzako bizkarra duen eserlekua', 'Asento con respaldo para unha persoa', 'Seient amb respatller per a una persona', 'Siège avec dossier pour une personne'],
        ['hogar', 'CAMA', 'cama', '🛏️', 'Mueble donde dormimos', 'Furniture where we sleep', 'Lo egiten dugun altzaria', 'Moble onde durmimos', 'Moble on dormim', 'Meuble où l’on dort'],
        ['hogar', 'COCINA', 'cocina', '🍳', 'Habitación donde se prepara la comida', 'Room where food is prepared', 'Janaria prestatzen den gela', 'Cuarto onde se prepara a comida', 'Habitació on es prepara el menjar', 'Pièce où l’on prépare les repas'],
        ['hogar', 'ESCALERA', 'escalera', '🪜', 'Peldaños para subir y bajar', 'Steps for going up and down', 'Igo eta jaisteko mailak', 'Chanzos para subir e baixar', 'Esglaons per pujar i baixar', 'Marches pour monter et descendre'],
        ['hogar', 'VENTANA', 'ventana', '🪟', 'Abertura con cristal en la pared', 'Glass opening in a wall', 'Hormako beirazko irekiera', 'Abertura con cristal na parede', 'Obertura amb vidre a la paret', 'Ouverture vitrée dans un mur'],
        ['hogar', 'PUERTA', 'puerta', '🚪', 'Se abre para entrar o salir', 'You open it to enter or leave', 'Sartzeko edo irteteko irekitzen da', 'Ábrese para entrar ou saír', 'S’obre per entrar o sortir', 'On l’ouvre pour entrer ou sortir'],
        ['hogar', 'ARMARIO', 'armario', '🗄️', 'Mueble para guardar ropa', 'Furniture for storing clothes', 'Arropa gordetzeko altzaria', 'Moble para gardar roupa', 'Moble per guardar roba', 'Meuble pour ranger les vêtements'],
        ['hogar', 'ALFOMBRA', 'alfombra', '🧶', 'Tejido que cubre el suelo', 'Fabric covering the floor', 'Zorua estaltzen duen ehuna', 'Tecido que cobre o chan', 'Teixit que cobreix el terra', 'Tissu qui recouvre le sol'],
        ['hogar', 'LAMPARA', 'lámpara', '💡', 'Da luz en una habitación', 'Gives light in a room', 'Gela batean argia ematen du', 'Dá luz nunha habitación', 'Dona llum en una habitació', 'Donne de la lumière dans une pièce'],
        ['hogar', 'ESPEJO', 'espejo', '🪞', 'Superficie que refleja tu imagen', 'Surface that reflects your image', 'Zure irudia islatzen duen gainazala', 'Superficie que reflicte a túa imaxe', 'Superfície que reflecteix la teva imatge', 'Surface qui reflète ton image'],

        // ── ESCUELA ───────────────────────────────────────────────
        ['escuela', 'LAPIZ', 'lápiz', '✏️', 'Sirve para escribir y se puede borrar', 'Used for writing and can be erased', 'Idazteko balio du eta ezaba daiteke', 'Serve para escribir e pódese borrar', 'Serveix per escriure i es pot esborrar', 'Sert à écrire et peut s’effacer'],
        ['escuela', 'CUADERNO', 'cuaderno', '📓', 'Conjunto de hojas para escribir', 'Set of sheets for writing', 'Idazteko orri multzoa', 'Conxunto de follas para escribir', 'Conjunt de fulls per escriure', 'Ensemble de feuilles pour écrire'],
        ['escuela', 'REGLA', 'regla', '📏', 'Sirve para medir y trazar rectas', 'Used to measure and draw straight lines', 'Neurtzeko eta marra zuzenak egiteko', 'Serve para medir e trazar rectas', 'Serveix per mesurar i traçar rectes', 'Sert à mesurer et tracer des droites'],
        ['escuela', 'GOMA', 'goma', '🧽', 'Borra lo escrito a lápiz', 'Rubs out pencil writing', 'Arkatzez idatzitakoa ezabatzen du', 'Borra o escrito a lapis', 'Esborra el que s’ha escrit a llapis', 'Efface ce qui est écrit au crayon'],
        ['escuela', 'MOCHILA', 'mochila', '🎒', 'Bolsa que se lleva a la espalda', 'Bag carried on the back', 'Bizkarrean eramaten den poltsa', 'Bolsa que se leva ás costas', 'Bossa que es porta a l’esquena', 'Sac que l’on porte sur le dos'],
        ['escuela', 'PIZARRA', 'pizarra', '🧑‍🏫', 'Superficie donde escribe el profesor', 'Surface where the teacher writes', 'Irakasleak idazten duen gainazala', 'Superficie onde escribe o profesor', 'Superfície on escriu el professor', 'Surface où écrit l’enseignant'],
        ['escuela', 'TIJERAS', 'tijeras', '✂️', 'Sirven para cortar papel', 'Used to cut paper', 'Papera mozteko balio dute', 'Serven para cortar papel', 'Serveixen per tallar paper', 'Servent à couper du papier'],
        ['escuela', 'RECREO', 'recreo', '⚽', 'Descanso para jugar entre clases', 'Break to play between lessons', 'Klaseen arteko jolas-atsedena', 'Descanso para xogar entre clases', 'Descans per jugar entre classes', 'Pause pour jouer entre les cours'],
        ['escuela', 'PROFESOR', 'profesor', '👩‍🏫', 'Persona que da clase', 'Person who gives lessons', 'Klasea ematen duen pertsona', 'Persoa que dá clase', 'Persona que fa classe', 'Personne qui donne cours'],
        ['escuela', 'EXAMEN', 'examen', '📝', 'Prueba para comprobar lo aprendido', 'Test to check what you have learned', 'Ikasitakoa egiaztatzeko proba', 'Proba para comprobar o aprendido', 'Prova per comprovar el que s’ha après', 'Épreuve pour vérifier ce qu’on a appris'],
        ['escuela', 'DEBERES', 'deberes', '📚', 'Tareas para hacer en casa', 'Tasks to do at home', 'Etxean egiteko lanak', 'Tarefas para facer na casa', 'Tasques per fer a casa', 'Travail à faire à la maison'],
        ['escuela', 'BIBLIOTECA', 'biblioteca', '🏛️', 'Lugar donde se guardan y prestan libros', 'Place where books are kept and lent', 'Liburuak gordetzen eta uzten diren lekua', 'Lugar onde se gardan e prestan libros', 'Lloc on es guarden i es presten llibres', 'Lieu où l’on garde et prête des livres'],

        // ── MAR ───────────────────────────────────────────────────
        ['mar', 'OLA', 'ola', '🌊', 'Onda que se forma en la superficie del mar', 'Wave that forms on the sea surface', 'Itsasoaren gainazalean sortzen den uhina', 'Onda que se forma na superficie do mar', 'Onada que es forma a la superfície del mar', 'Vague qui se forme à la surface de la mer'],
        ['mar', 'MAREA', 'marea', '🌙', 'Subida y bajada del nivel del mar', 'Rising and falling of the sea level', 'Itsas mailaren igoera eta jaitsiera', 'Subida e baixada do nivel do mar', 'Pujada i baixada del nivell del mar', 'Montée et descente du niveau de la mer'],
        ['mar', 'ARENA', 'arena', '🏖️', 'Granos finos que cubren la playa', 'Fine grains covering the beach', 'Hondartza estaltzen duten ale finak', 'Gran fino que cobre a praia', 'Grans fins que cobreixen la platja', 'Grains fins qui couvrent la plage'],
        ['mar', 'CORAL', 'coral', '🪸', 'Animal marino que forma arrecifes', 'Sea animal that builds reefs', 'Arrezifeak eraikitzen dituen itsas animalia', 'Animal mariño que forma arrecifes', 'Animal marí que forma esculls', 'Animal marin qui forme des récifs'],
        ['mar', 'DELFIN', 'delfín', '🐬', 'Mamífero marino muy inteligente y juguetón', 'Very intelligent, playful sea mammal', 'Itsas ugaztun oso azkarra eta jolastia', 'Mamífero mariño moi intelixente e xogón', 'Mamífer marí molt intel·ligent i joguiner', 'Mammifère marin très intelligent et joueur'],
        ['mar', 'MEDUSA', 'medusa', '🪼', 'Animal marino transparente que pica', 'Transparent sea animal that stings', 'Itsas animalia gardena, eztenkatzen duena', 'Animal mariño transparente que pica', 'Animal marí transparent que pica', 'Animal marin transparent qui pique'],
        ['mar', 'PULPO', 'pulpo', '🐙', 'Molusco con ocho brazos', 'Mollusc with eight arms', 'Zortzi besoko moluskua', 'Molusco con oito brazos', 'Mol·lusc amb vuit braços', 'Mollusque à huit bras'],
        ['mar', 'TIBURON', 'tiburón', '🦈', 'Gran pez depredador de dientes afilados', 'Large predatory fish with sharp teeth', 'Hortz zorrotzeko arrain harrapari handia', 'Gran peixe depredador de dentes afiados', 'Gran peix depredador de dents esmolades', 'Grand poisson prédateur aux dents acérées'],
        ['mar', 'ANCLA', 'ancla', '⚓', 'Pieza pesada que sujeta el barco al fondo', 'Heavy piece that holds a ship to the bottom', 'Ontzia hondoan eusten duen pieza astuna', 'Peza pesada que suxeita o barco ao fondo', 'Peça pesant que subjecta el vaixell al fons', 'Pièce lourde qui retient le bateau au fond'],
        ['mar', 'FARO', 'faro', '🗼', 'Torre con luz que guía a los barcos', 'Tower with a light that guides ships', 'Ontziak gidatzen dituen argidun dorrea', 'Torre con luz que guía os barcos', 'Torre amb llum que guia els vaixells', 'Tour lumineuse qui guide les bateaux'],
        ['mar', 'ISLA', 'isla', '🏝️', 'Tierra rodeada de agua', 'Land surrounded by water', 'Urez inguratutako lur zatia', 'Terra rodeada de auga', 'Terra envoltada d’aigua', 'Terre entourée d’eau'],
        ['mar', 'CANGREJO', 'cangrejo', '🦀', 'Crustáceo de pinzas que camina de lado', 'Pincered crustacean that walks sideways', 'Atzaparrak dituen krustazeoa, alde batera ibiltzen dena', 'Crustáceo de pinzas que camiña de lado', 'Crustaci de pinces que camina de costat', 'Crustacé à pinces qui marche de côté'],
    ];
    const have = new Set(CW_CLUES.map(c => c.word));
    rows.forEach(([category, word, display, emoji, es, en, eu, gl, ca, fr]) => {
        if (have.has(word)) return;
        CW_CLUES.push({
            word, display, category, emoji,
            es: { clue: es }, en: { clue: en }, eu: { clue: eu },
            gl: { clue: gl }, ca: { clue: ca }, fr: { clue: fr },
        });
    });
})();
