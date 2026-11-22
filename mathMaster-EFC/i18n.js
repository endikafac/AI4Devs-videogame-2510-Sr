/**
 * MathMaster - Sistema de Internacionalización (i18n)
 * Soporta: Castellano (es-ES), Inglés (en-US), Euskera (eu-ES), Gallego (gl-ES), Catalán (ca-ES), Francés (fr-FR)
 */

const MathMasterI18n = {
    // Idioma actual
    currentLanguage: 'es-ES',

    // Idiomas disponibles
    availableLanguages: {
        'es-ES': { name: 'Castellano', flag: '🇪🇸' },
        'en-US': { name: 'English', flag: '🇺🇸' },
        'eu-ES': { name: 'Euskara', flag: '🏴' },
        'gl-ES': { name: 'Galego', flag: '🏴' },
        'ca-ES': { name: 'Català', flag: '🏴' },
        'fr-FR': { name: 'Français', flag: '🇫🇷' }
    },

    // ==================== TRADUCCIONES ====================

    translations: {
        // ==================== CASTELLANO (es-ES) ====================
        'es-ES': {
            // Título y subtítulo
            appTitle: 'MathMaster',
            appSubtitle: 'Desafío por Puntuación Fija',
            loading: "Cargando...",
            backToHub: "Games Hub",

            // Pantalla de Login
            selectOrCreateProfile: 'Selecciona o crea tu perfil',
            noSavedProfiles: 'No hay perfiles guardados',
            playerNamePlaceholder: 'Nombre del jugador',
            createProfile: 'Crear Perfil',
            playAsGuest: 'Jugar como Invitado',
            created: 'Creado',
            deleteProfile: 'Eliminar perfil',

            // Selección de juego
            chooseOperation: 'Elige la operación o el tema',
            difficultyLevel: 'Nivel de Dificultad',
            tableOf: 'Tabla del...',
            questionCount: 'Cantidad de Preguntas',
            start: '¡EMPEZAR!',
            statistics: 'Estadísticas',
            achievements: 'Logros',

            // Operaciones
            operations: {
                suma: 'Suma',
                resta: 'Resta',
                multiplicacion: 'Multiplicación',
                division: 'División',
                tablas: 'Tablas',
                mezcla: 'Mezcla',
                problemas: "Problemas",
                fracciones: "Fracciones",
                porcentajes: "Porcentajes",
                secuencias: "Series",
                huecos: "Qué falta",
                potencias: "Potencias"
            },

            // Niveles
            levels: {
                1: { name: 'Básica y Tablas', description: 'Sumas/Restas de 1 a 10. Resultado siempre positivo. Multiplicación y división de factores de 1 a 10.' },
                2: { name: 'Números Medianos', description: 'Sumas/Restas de 1 a 100. Resultado siempre positivo. Multiplicación hasta 15. División con cociente entero.' },
                3: { name: 'Grandes Enteros', description: 'Sumas/Restas de 1 a 1,000. Factores de multiplicación hasta 30. División con cociente entero.' },
                4: { name: 'Decimales Simples', description: 'Números hasta 10,000 con decimales simples (X.X). División con 1 decimal en resultado.' },
                5: { name: 'Decimales Complejos', description: 'Números hasta 100,000 con decimales (X.XXX). Multiplicación de números grandes. División con 2 decimales.' },
                6: { name: 'Números Negativos', description: 'Suma y Resta con números negativos frecuentes (Ej: -10 + 25). Multiplicación de 3 dígitos. División con 3 decimales.' },
                7: { name: 'Cadenas de Operaciones', description: 'Cadenas de suma/resta (Ej: 15 - 8 + 3). Multiplicación de 4x2 dígitos. División con decimales en divisor.' },
                8: { name: '4 Dígitos / Mezcla básica', description: 'Operación individual: números de 4 dígitos (suma/resta 1000-9999, mult 4×3 dígitos). Mezcla: jerarquía sin paréntesis (a×b + c).' },
                9: { name: '5 Dígitos / Pre-Álgebra', description: 'Operación individual: números de 5 dígitos. Mezcla: incógnita X con las 4 operaciones (X + 15 = 27).' },
                10: { name: 'Maestro: Grandes Números', description: 'Operación individual: números muy grandes (mult 4×4 dígitos, dividendos enormes). Mezcla: PEMDAS con paréntesis.' }
            },
            selectLevelDescription: 'Selecciona un nivel para ver su descripción',
            selectLevelDesc: 'Selecciona un nivel para ver su descripción',
            allTables: 'Todas',
            tablesAll: 'Tablas de Multiplicar - Todas',
            tableOf: 'Tabla del {number}',
            operationLevel: '{operation} - Nivel {level}',

            // Pantalla de juego
            time: 'Tiempo',
            score: 'Puntuación',
            streak: 'Racha',
            yourAnswer: 'Tu respuesta',
            verify: 'Verificar',
            pause: 'Pausar',
            exit: 'Salir',
            readQuestion: 'Leer pregunta en voz alta',

            // Feedback
            correct: '¡Correcto!',
            excellentStreak: '¡Excelente! Racha de {streak}',
            goodStreak: '¡Muy bien! Racha de {streak}',
            incorrectTryAgain: '¡Incorrecto! Inténtalo de nuevo',
            enterValidNumber: 'Ingresa un número válido',
            hintRange: 'Pista: Es un número entre {min} y {max}',
            hintNegative: 'Pista: Es un número negativo',
            hintApprox: 'Pista: El resultado es aproximadamente {value}',

            // Pausa
            gamePaused: 'Juego Pausado',
            answers: 'Respuestas',
            continue: 'Continuar',
            restart: 'Reiniciar',
            mainMenu: 'Menú Principal',

            // Resultados
            congratulations: '¡Felicitaciones!',
            resultPerfect: '¡Perfecto!',
            resultExcellent: '¡Excelente!',
            resultVeryGood: '¡Muy Bien!',
            resultGoodTry: '¡Buen Intento!',
            correctAnswers: 'Respuestas Correctas',
            totalTime: 'Tiempo Total',
            bestStreak: 'Mejor Racha',
            precision: 'Precisión',
            totalAttempts: 'Intentos Totales',
            avgPerQuestion: 'Promedio por Pregunta',
            newTimeRecord: '¡Nuevo Récord de Tiempo!',
            achievementsUnlocked: 'Logros Desbloqueados',
            playAgain: 'Jugar de Nuevo',

            // Estadísticas
            back: 'Volver',
            generalSummary: 'Resumen General',
            gamesPlayed: 'Partidas Jugadas',
            correctAnswersTotal: 'Respuestas Correctas',
            globalPrecision: 'Precisión Global',
            totalTimeSpent: 'Tiempo Total',
            byOperation: 'Por Operación',
            games: 'partidas',
            corrects: 'correctas',
            noGamesYet: 'Aún no has jugado ninguna partida',
            statsGamesCorrect: '{games} partidas / {correct} correctas',
            loginForStats: 'Inicia sesión para ver tus estadísticas',

            // Configuración
            settings: 'Configuración',
            audio: 'Audio',
            soundEffects: 'Efectos de Sonido',
            soundEffectsDesc: 'Sonidos para aciertos, errores y logros',
            volume: 'Volumen',
            textToSpeech: 'Lectura en Voz Alta (TTS)',
            textToSpeechDesc: 'Lee las preguntas y resultados',
            accessibility: 'Accesibilidad',
            highContrastMode: 'Modo Alto Contraste',
            highContrastDesc: 'Mejora la visibilidad para personas con dificultades visuales',
            language: 'Idioma',
            languageDesc: 'Selecciona el idioma de la interfaz',
            account: 'Cuenta',
            currentUser: 'Usuario Actual',
            guest: 'Invitado',
            guestNoProgress: 'Invitado (sin guardar progreso)',
            change: 'Cambiar',
            deleteAccount: 'Eliminar Cuenta',
            deleteAccountDesc: 'Esta acción no se puede deshacer',
            delete: 'Eliminar',
            close: 'Cerrar',

            // Menú de usuario
            myProfile: 'Mi Perfil',
            logout: 'Cerrar Sesión',

            // Pantalla de perfil
            lastActivity: 'Última actividad',
            quickStats: 'Resumen Rápido',
            viewAllStats: 'Ver Estadísticas Completas',
            viewAllAchievements: 'Ver Todos los Logros',

            // Confirmaciones
            areYouSure: '¿Estás seguro?',
            actionCannotBeUndone: 'Esta acción no se puede deshacer.',
            deleteProfileConfirmTitle: '¿Eliminar perfil?',
            deleteProfileConfirmMessage: 'Se eliminará permanentemente el perfil "{username}" y todos sus datos.',
            deleteAccountConfirmTitle: '¿Eliminar tu cuenta?',
            deleteAccountConfirmMessage: 'Se eliminarán permanentemente todos tus datos, estadísticas y logros. Esta acción no se puede deshacer.',
            cancel: 'Cancelar',
            confirm: 'Confirmar',

            // Alertas
            enterUsername: 'Por favor, ingresa un nombre de usuario',
            usernameLengthError: 'El nombre debe tener entre 2 y 20 caracteres',
            usernameExists: 'Ya existe un usuario con ese nombre',
            loginToViewStats: 'Inicia sesión para ver tus estadísticas',

            // TTS
            ttsCorrect: 'Correcto',
            ttsIncorrect: 'Incorrecto, intenta de nuevo',
            ttsAchievementUnlocked: 'Logro desbloqueado',
            ttsGameStarted: 'Juego iniciado',
            ttsGameCompleted: 'Felicitaciones, has completado el desafío',
            ttsStreak: 'Racha de {streak}',
            ttsResults: 'Has completado el desafío con {correct} respuestas correctas en {minutes} minutos y {seconds} segundos. Tu precisión fue del {accuracy} por ciento.',

            // TTS - Operaciones matemáticas
            ttsMathTimes: 'por',
            ttsMathDividedBy: 'dividido',
            ttsMathPlus: 'más',
            ttsMathMinus: 'menos',
            ttsMathEquals: 'igual a',
            ttsMathQuestionMark: 'interrogación',
            ttsMathUnknownX: 'equis',

            // Logros
            achievementNames: {
                first_correct: 'Primer Paso',
                streak_5: 'En Racha',
                streak_10: 'Imparable',
                perfect_game: 'Perfeccionista',
                games_10: 'Estudiante Dedicado',
                games_50: 'Maestro del Estudio',
                level_5: 'Escalador',
                level_10: 'Conquistador',
                speed_demon: 'Velocista',
                all_operations: 'Todoterreno',
                hundred_correct: 'Centenario',
                multiplication_master: 'Maestro de Tablas',
                early_bird: 'Madrugador',
                night_owl: 'Búho Nocturno',
                comeback_kid: 'Nunca Te Rindas',
                topic_explorer: "Explorador de Temas"
            },
            achievementDescriptions: {
                first_correct: 'Responde correctamente tu primera pregunta',
                streak_5: 'Consigue una racha de 5 respuestas correctas',
                streak_10: 'Consigue una racha de 10 respuestas correctas',
                perfect_game: 'Completa una partida sin errores',
                games_10: 'Completa 10 partidas',
                games_50: 'Completa 50 partidas',
                level_5: 'Completa una partida en nivel 5 o superior',
                level_10: 'Completa una partida en nivel 10',
                speed_demon: 'Completa 20 preguntas en menos de 2 minutos',
                all_operations: 'Completa al menos una partida de cada operación',
                hundred_correct: 'Responde correctamente 100 preguntas en total',
                multiplication_master: 'Completa 10 partidas de tablas de multiplicar',
                early_bird: 'Juega tu primera partida antes de las 8 AM',
                night_owl: 'Juega una partida después de las 10 PM',
                comeback_kid: 'Gana una partida después de usar 3+ pistas',
                topic_explorer: "Juega una partida de cada tema: problemas, fracciones, porcentajes, series, qué falta y potencias"
            },
            achievementUnlockedTitle: '¡Logro Desbloqueado!',

            // Indicadores de operación
            multiplicationTablesAll: 'Tablas de Multiplicar - Todas',
            tableOfNumber: 'Tabla del {number}',
            operationLevel: '{operation} - Nivel {level}',

            // Footer
            signInWithGoogle: 'Entrar con Google',
            signOut: 'Cerrar sesión',
            developedBy: 'Games Hub | MathMaster v3.0',

            topicTier: {
                1: "Niveles 1-3: ejercicios sencillos con números pequeños.",
                2: "Niveles 4-6: ejercicios medianos, un poco más de cálculo.",
                3: "Niveles 7-8: difíciles, con varios pasos.",
                4: "Niveles 9-10: de experto, ¡para campeones!"
            },

            // New topics: tips, review, word problems
            answerWas: "La respuesta era {answer}",
            reviewTitle: "Para repasar",
            tipNextLevel: "¡Gran partida! Prueba ahora el nivel {level}.",
            tipSameLevel: "Vas muy bien. Repite para afianzarlo.",
            tipEasierLevel: "Sin prisa. Prueba un nivel más bajo y repasa tus errores.",
            starsLabel: "{n} de 3 estrellas",
            problem1: "Ana tiene {a} cromos y su amigo Leo le regala {b} más. ¿Cuántos cromos tiene ahora?",
            problem2: "En un autobús viajan {a} personas. En la parada bajan {b}. ¿Cuántas personas quedan en el autobús?",
            problem3: "Un paquete tiene {a} galletas. ¿Cuántas galletas hay en {b} paquetes?",
            problem4: "Se reparten {a} euros entre {b} hermanos a partes iguales. ¿Cuántos euros recibe cada uno?",
            problem5: "Ana compra {a} cuadernos a {b} euros cada uno y paga con {c} euros. ¿Cuánto dinero le devuelven?",
            problem6: "Leo tiene {a} canicas y Ana tiene {b} más que Leo. ¿Cuántas canicas tienen entre los dos?",
            problem7: "Una película dura {h} horas y {m} minutos. ¿Cuántos minutos dura en total?",
            problem8: "Una camiseta cuesta {a} euros y tiene un descuento del {p} %. ¿Cuántos euros hay que pagar?",
            problem9: "Hay {a} huevos y cada caja lleva {b}. ¿Cuántas cajas se pueden llenar del todo?"
        },

        // ==================== ENGLISH (en-US) ====================
        'en-US': {
            // Title and subtitle
            appTitle: 'MathMaster',
            appSubtitle: 'Fixed Score Challenge',
            loading: "Loading...",
            backToHub: "Games Hub",

            // Login screen
            selectOrCreateProfile: 'Select or create your profile',
            noSavedProfiles: 'No saved profiles',
            playerNamePlaceholder: 'Player name',
            createProfile: 'Create Profile',
            playAsGuest: 'Play as Guest',
            created: 'Created',
            deleteProfile: 'Delete profile',

            // Game selection
            chooseOperation: 'Choose an operation or topic',
            difficultyLevel: 'Difficulty Level',
            tableOf: 'Table of...',
            questionCount: 'Number of Questions',
            start: 'START!',
            statistics: 'Statistics',
            achievements: 'Achievements',

            // Operations
            operations: {
                suma: 'Addition',
                resta: 'Subtraction',
                multiplicacion: 'Multiplication',
                division: 'Division',
                tablas: 'Tables',
                mezcla: 'Mix',
                problemas: "Word problems",
                fracciones: "Fractions",
                porcentajes: "Percentages",
                secuencias: "Sequences",
                huecos: "Missing",
                potencias: "Powers"
            },

            // Levels
            levels: {
                1: { name: 'Basic and Tables', description: 'Addition/Subtraction from 1 to 10. Always positive result. Multiplication and division with factors from 1 to 10.' },
                2: { name: 'Medium Numbers', description: 'Addition/Subtraction from 1 to 100. Always positive result. Multiplication up to 15. Division with integer quotient.' },
                3: { name: 'Large Integers', description: 'Addition/Subtraction from 1 to 1,000. Multiplication factors up to 30. Division with integer quotient.' },
                4: { name: 'Simple Decimals', description: 'Numbers up to 10,000 with simple decimals (X.X). Division with 1 decimal in result.' },
                5: { name: 'Complex Decimals', description: 'Numbers up to 100,000 with decimals (X.XXX). Large number multiplication. Division with 2 decimals.' },
                6: { name: 'Negative Numbers', description: 'Addition and Subtraction with frequent negative numbers (Ex: -10 + 25). 3-digit multiplication. Division with 3 decimals.' },
                7: { name: 'Operation Chains', description: 'Addition/subtraction chains (Ex: 15 - 8 + 3). 4x2 digit multiplication. Division with decimal divisor.' },
                8: { name: '4 Digits / Basic Mix', description: 'Single operation: 4-digit numbers. Mix mode: order of operations without parentheses.' },
                9: { name: '5 Digits / Pre-Algebra', description: 'Single operation: 5-digit numbers. Mix mode: solve for X with all 4 operations.' },
                10: { name: 'Master: Big Numbers', description: 'Single operation: very large numbers. Mix mode: full PEMDAS with parentheses.' }
            },
            selectLevelDescription: 'Select a level to see its description',
            selectLevelDesc: 'Select a level to see its description',
            allTables: 'All',
            tablesAll: 'Multiplication Tables - All',
            tableOf: 'Table of {number}',
            operationLevel: '{operation} - Level {level}',

            // Game screen
            time: 'Time',
            score: 'Score',
            streak: 'Streak',
            yourAnswer: 'Your answer',
            verify: 'Verify',
            pause: 'Pause',
            exit: 'Exit',
            readQuestion: 'Read question aloud',

            // Feedback
            correct: 'Correct!',
            excellentStreak: 'Excellent! Streak of {streak}',
            goodStreak: 'Very good! Streak of {streak}',
            incorrectTryAgain: 'Incorrect! Try again',
            enterValidNumber: 'Enter a valid number',
            hintRange: 'Hint: It\'s a number between {min} and {max}',
            hintNegative: 'Hint: It\'s a negative number',
            hintApprox: 'Hint: The result is approximately {value}',

            // Pause
            gamePaused: 'Game Paused',
            answers: 'Answers',
            continue: 'Continue',
            restart: 'Restart',
            mainMenu: 'Main Menu',

            // Results
            congratulations: 'Congratulations!',
            resultPerfect: 'Perfect!',
            resultExcellent: 'Excellent!',
            resultVeryGood: 'Very Good!',
            resultGoodTry: 'Good Try!',
            correctAnswers: 'Correct Answers',
            totalTime: 'Total Time',
            bestStreak: 'Best Streak',
            precision: 'Accuracy',
            totalAttempts: 'Total Attempts',
            avgPerQuestion: 'Average per Question',
            newTimeRecord: 'New Time Record!',
            achievementsUnlocked: 'Achievements Unlocked',
            playAgain: 'Play Again',

            // Statistics
            back: 'Back',
            generalSummary: 'General Summary',
            gamesPlayed: 'Games Played',
            correctAnswersTotal: 'Correct Answers',
            globalPrecision: 'Global Accuracy',
            totalTimeSpent: 'Total Time',
            byOperation: 'By Operation',
            games: 'games',
            corrects: 'correct',
            noGamesYet: 'You haven\'t played any games yet',
            statsGamesCorrect: '{games} games / {correct} correct',
            loginForStats: 'Log in to view your statistics',

            // Settings
            settings: 'Settings',
            audio: 'Audio',
            soundEffects: 'Sound Effects',
            soundEffectsDesc: 'Sounds for correct answers, errors and achievements',
            volume: 'Volume',
            textToSpeech: 'Text-to-Speech (TTS)',
            textToSpeechDesc: 'Reads questions and results aloud',
            accessibility: 'Accessibility',
            highContrastMode: 'High Contrast Mode',
            highContrastDesc: 'Improves visibility for people with visual difficulties',
            language: 'Language',
            languageDesc: 'Select interface language',
            account: 'Account',
            currentUser: 'Current User',
            guest: 'Guest',
            guestNoProgress: 'Guest (progress not saved)',
            change: 'Change',
            deleteAccount: 'Delete Account',
            deleteAccountDesc: 'This action cannot be undone',
            delete: 'Delete',
            close: 'Close',

            // User menu
            myProfile: 'My Profile',
            logout: 'Log Out',

            // Profile screen
            lastActivity: 'Last activity',
            quickStats: 'Quick Stats',
            viewAllStats: 'View All Statistics',
            viewAllAchievements: 'View All Achievements',

            // Confirmations
            areYouSure: 'Are you sure?',
            actionCannotBeUndone: 'This action cannot be undone.',
            deleteProfileConfirmTitle: 'Delete profile?',
            deleteProfileConfirmMessage: 'The profile "{username}" and all its data will be permanently deleted.',
            deleteAccountConfirmTitle: 'Delete your account?',
            deleteAccountConfirmMessage: 'All your data, statistics and achievements will be permanently deleted. This action cannot be undone.',
            cancel: 'Cancel',
            confirm: 'Confirm',

            // Alerts
            enterUsername: 'Please enter a username',
            usernameLengthError: 'Username must be between 2 and 20 characters',
            usernameExists: 'A user with that name already exists',
            loginToViewStats: 'Log in to view your statistics',

            // TTS
            ttsCorrect: 'Correct',
            ttsIncorrect: 'Incorrect, try again',
            ttsAchievementUnlocked: 'Achievement unlocked',
            ttsGameStarted: 'Game started',
            ttsGameCompleted: 'Congratulations, you have completed the challenge',
            ttsStreak: 'Streak of {streak}',
            ttsResults: 'You completed the challenge with {correct} correct answers in {minutes} minutes and {seconds} seconds. Your accuracy was {accuracy} percent.',

            // TTS - Math operations
            ttsMathTimes: 'times',
            ttsMathDividedBy: 'divided by',
            ttsMathPlus: 'plus',
            ttsMathMinus: 'minus',
            ttsMathEquals: 'equals',
            ttsMathQuestionMark: 'question mark',
            ttsMathUnknownX: 'X',

            // Achievements
            achievementNames: {
                first_correct: 'First Step',
                streak_5: 'On Fire',
                streak_10: 'Unstoppable',
                perfect_game: 'Perfectionist',
                games_10: 'Dedicated Student',
                games_50: 'Study Master',
                level_5: 'Climber',
                level_10: 'Conqueror',
                speed_demon: 'Speed Demon',
                all_operations: 'All-Rounder',
                hundred_correct: 'Centurion',
                multiplication_master: 'Tables Master',
                early_bird: 'Early Bird',
                night_owl: 'Night Owl',
                comeback_kid: 'Never Give Up',
                topic_explorer: "Topic Explorer"
            },
            achievementDescriptions: {
                first_correct: 'Answer your first question correctly',
                streak_5: 'Get a streak of 5 correct answers',
                streak_10: 'Get a streak of 10 correct answers',
                perfect_game: 'Complete a game without errors',
                games_10: 'Complete 10 games',
                games_50: 'Complete 50 games',
                level_5: 'Complete a game at level 5 or higher',
                level_10: 'Complete a game at level 10',
                speed_demon: 'Complete 20 questions in less than 2 minutes',
                all_operations: 'Complete at least one game of each operation',
                hundred_correct: 'Answer 100 questions correctly in total',
                multiplication_master: 'Complete 10 multiplication tables games',
                early_bird: 'Play your first game before 8 AM',
                night_owl: 'Play a game after 10 PM',
                comeback_kid: 'Win a game after using 3+ hints',
                topic_explorer: "Play one game of every topic: word problems, fractions, percentages, sequences, missing number and powers"
            },
            achievementUnlockedTitle: 'Achievement Unlocked!',

            // Operation indicators
            multiplicationTablesAll: 'Multiplication Tables - All',
            tableOfNumber: 'Table of {number}',
            operationLevel: '{operation} - Level {level}',

            // Footer
            signInWithGoogle: 'Sign in with Google',
            signOut: 'Sign out',
            developedBy: 'Games Hub | MathMaster v3.0',

            topicTier: {
                1: "Levels 1-3: simple exercises with small numbers.",
                2: "Levels 4-6: medium exercises, a bit more calculation.",
                3: "Levels 7-8: hard, with several steps.",
                4: "Levels 9-10: expert level, for champions!"
            },

            // New topics: tips, review, word problems
            answerWas: "The answer was {answer}",
            reviewTitle: "To review",
            tipNextLevel: "Great game! Try level {level} now.",
            tipSameLevel: "You are doing very well. Play again to lock it in.",
            tipEasierLevel: "No rush. Try a lower level and review your mistakes.",
            starsLabel: "{n} of 3 stars",
            problem1: "Ana has {a} stickers and her friend Leo gives her {b} more. How many stickers does she have now?",
            problem2: "There are {a} people on a bus. At the stop, {b} get off. How many people are left on the bus?",
            problem3: "One pack has {a} cookies. How many cookies are there in {b} packs?",
            problem4: "{a} euros are shared equally among {b} brothers and sisters. How many euros does each one get?",
            problem5: "Ana buys {a} notebooks at {b} euros each and pays with {c} euros. How much change does she get?",
            problem6: "Leo has {a} marbles and Ana has {b} more than Leo. How many marbles do they have together?",
            problem7: "A film lasts {h} hours and {m} minutes. How many minutes is that in total?",
            problem8: "A T-shirt costs {a} euros and has a {p} % discount. How many euros do you pay?",
            problem9: "There are {a} eggs and each box holds {b}. How many boxes can be filled completely?"
        },

        // ==================== EUSKERA (eu-ES) ====================
        'eu-ES': {
            // Titulua eta azpititulua
            appTitle: 'MathMaster',
            appSubtitle: 'Puntuazio Finkoaren Erronka',
            loading: "Kargatzen...",
            backToHub: "Games Hub",

            // Sarrera pantaila
            selectOrCreateProfile: 'Aukeratu edo sortu zure profila',
            noSavedProfiles: 'Ez dago gordetako profilik',
            playerNamePlaceholder: 'Jokalariaren izena',
            createProfile: 'Profila Sortu',
            playAsGuest: 'Gonbidatu gisa Jokatu',
            created: 'Sortua',
            deleteProfile: 'Profila ezabatu',

            // Joko aukeraketa
            chooseOperation: 'Aukeratu eragiketa edo gaia',
            difficultyLevel: 'Zailtasun Maila',
            tableOf: '...ren Taula',
            questionCount: 'Galdera Kopurua',
            start: 'HASI!',
            statistics: 'Estatistikak',
            achievements: 'Lorpenak',

            // Eragiketak
            operations: {
                suma: 'Batuketa',
                resta: 'Kenketa',
                multiplicacion: 'Biderketa',
                division: 'Zatiketa',
                tablas: 'Taulak',
                mezcla: 'Nahasketa',
                problemas: "Problemak",
                fracciones: "Zatikiak",
                porcentajes: "Ehunekoak",
                secuencias: "Segidak",
                huecos: "Zer falta da",
                potencias: "Berredurak"
            },

            // Mailak
            levels: {
                1: { name: 'Oinarrizkoa eta Taulak', description: '1etik 10era batuketa/kenketa. Emaitza beti positiboa. 1etik 10erako faktoreekin biderketa eta zatiketa.' },
                2: { name: 'Zenbaki Ertainak', description: '1etik 100era batuketa/kenketa. Emaitza beti positiboa. 15 arterainoko biderketa. Zatidura osoko zatiketa.' },
                3: { name: 'Osoko Handiak', description: '1etik 1.000ra batuketa/kenketa. 30 arterainoko biderketa faktoreak. Zatidura osoko zatiketa.' },
                4: { name: 'Dezimal Sinpleak', description: '10.000 arteko zenbakiak dezimal sinpleekin (X.X). Zatiketa emaitza dezimal batekin.' },
                5: { name: 'Dezimal Konplexuak', description: '100.000 arteko zenbakiak dezimalekin (X.XXX). Zenbaki handien biderketa. 2 dezimaldun zatiketa.' },
                6: { name: 'Zenbaki Negatiboak', description: 'Batuketa eta kenketa zenbaki negatibo ugariekin (Adib: -10 + 25). 3 digituko biderketa. 3 dezimaldun zatiketa.' },
                7: { name: 'Eragiketa Kateak', description: 'Batuketa/kenketa kateak (Adib: 15 - 8 + 3). 4x2 digituko biderketa. Zatitzaile dezimaldun zatiketa.' },
                8: { name: '4 Digitu / Oinarrizko Nahasketa', description: 'Eragiketa bakarra: 4 digituko zenbakiak. Nahasketa modua: eragiketa-ordena parentesirik gabe.' },
                9: { name: '5 Digitu / Aurre-Aljebra', description: 'Eragiketa bakarra: 5 digituko zenbakiak. Nahasketa modua: ebatzi X 4 eragiketarekin (X + 15 = 27).' },
                10: { name: 'Maisua: Zenbaki Handiak', description: 'Eragiketa bakarra: zenbaki oso handiak. Nahasketa modua: PEMDAS osoa parentesiekin.' }
            },
            selectLevelDescription: 'Aukeratu maila bat bere deskribapena ikusteko',
            selectLevelDesc: 'Aukeratu maila bat bere deskribapena ikusteko',
            allTables: 'Denak',
            tablesAll: 'Biderketa Taulak - Denak',
            tableOf: '{number}ren Taula',
            operationLevel: '{operation} - {level}. Maila',

            // Joko pantaila
            time: 'Denbora',
            score: 'Puntuazioa',
            streak: 'Segida',
            yourAnswer: 'Zure erantzuna',
            verify: 'Egiaztatu',
            pause: 'Pausatu',
            exit: 'Irten',
            readQuestion: 'Galdera ozen irakurri',

            // Feedbacka
            correct: 'Zuzena!',
            excellentStreak: 'Bikain! {streak}ko segida',
            goodStreak: 'Oso ongi! {streak}ko segida',
            incorrectTryAgain: 'Okerra! Saiatu berriro',
            enterValidNumber: 'Sartu zenbaki baliogarri bat',
            hintRange: 'Pista: {min} eta {max} arteko zenbaki bat da',
            hintNegative: 'Pista: Zenbaki negatiboa da',
            hintApprox: 'Pista: Emaitza gutxi gorabehera {value} da',

            // Pausa
            gamePaused: 'Jokoa Geldituta',
            answers: 'Erantzunak',
            continue: 'Jarraitu',
            restart: 'Berrabiarazi',
            mainMenu: 'Menu Nagusia',

            // Emaitzak
            congratulations: 'Zorionak!',
            resultPerfect: 'Perfektua!',
            resultExcellent: 'Bikaina!',
            resultVeryGood: 'Oso Ongi!',
            resultGoodTry: 'Saiakera Ona!',
            correctAnswers: 'Erantzun Zuzenak',
            totalTime: 'Denbora Totala',
            bestStreak: 'Segida Onena',
            precision: 'Zehaztasuna',
            totalAttempts: 'Saiakera Guztira',
            avgPerQuestion: 'Batez bestekoa Galderako',
            newTimeRecord: 'Denbora Errekord Berria!',
            achievementsUnlocked: 'Desblokeatutako Lorpenak',
            playAgain: 'Berriro Jokatu',

            // Estatistikak
            back: 'Atzera',
            generalSummary: 'Laburpen Orokorra',
            gamesPlayed: 'Jokatutako Partidak',
            correctAnswersTotal: 'Erantzun Zuzenak',
            globalPrecision: 'Zehaztasun Globala',
            totalTimeSpent: 'Denbora Totala',
            byOperation: 'Eragiketaka',
            games: 'partida',
            corrects: 'zuzen',
            noGamesYet: 'Oraindik ez duzu partidarik jokatu',
            statsGamesCorrect: '{games} partida / {correct} zuzen',
            loginForStats: 'Hasi saioa zure estatistikak ikusteko',

            // Ezarpenak
            settings: 'Ezarpenak',
            audio: 'Audioa',
            soundEffects: 'Soinu Efektuak',
            soundEffectsDesc: 'Soinuak asmatze, akats eta lorpenetarako',
            volume: 'Bolumena',
            textToSpeech: 'Ozen Irakurtzea (TTS)',
            textToSpeechDesc: 'Galderak eta emaitzak irakurtzen ditu',
            accessibility: 'Erabilerraztasuna',
            highContrastMode: 'Kontraste Altuko Modua',
            highContrastDesc: 'Ikusmen zailtasunak dituzten pertsonentzako ikusgarritasuna hobetzen du',
            language: 'Hizkuntza',
            languageDesc: 'Aukeratu interfazearen hizkuntza',
            account: 'Kontua',
            currentUser: 'Uneko Erabiltzailea',
            guest: 'Gonbidatua',
            guestNoProgress: 'Gonbidatua (aurrerapena ez da gordetzen)',
            change: 'Aldatu',
            deleteAccount: 'Kontua Ezabatu',
            deleteAccountDesc: 'Ekintza hau ezin da desegin',
            delete: 'Ezabatu',
            close: 'Itxi',

            // Erabiltzaile menua
            myProfile: 'Nire Profila',
            logout: 'Saioa Itxi',

            // Profil pantaila
            lastActivity: 'Azken jarduera',
            quickStats: 'Laburpen Azkarra',
            viewAllStats: 'Estatistika Guztiak Ikusi',
            viewAllAchievements: 'Lorpen Guztiak Ikusi',

            // Baieztapenak
            areYouSure: 'Ziur zaude?',
            actionCannotBeUndone: 'Ekintza hau ezin da desegin.',
            deleteProfileConfirmTitle: 'Profila ezabatu?',
            deleteProfileConfirmMessage: '"{username}" profila eta bere datu guztiak betiko ezabatuko dira.',
            deleteAccountConfirmTitle: 'Zure kontua ezabatu?',
            deleteAccountConfirmMessage: 'Zure datu, estatistika eta lorpen guztiak betiko ezabatuko dira. Ekintza hau ezin da desegin.',
            cancel: 'Utzi',
            confirm: 'Baieztatu',

            // Alertak
            enterUsername: 'Mesedez, sartu erabiltzaile izen bat',
            usernameLengthError: 'Izenak 2 eta 20 karaktere artean izan behar ditu',
            usernameExists: 'Badago izen hori duen erabiltzaile bat',
            loginToViewStats: 'Hasi saioa zure estatistikak ikusteko',

            // TTS
            ttsCorrect: 'Zuzena',
            ttsIncorrect: 'Okerra, saiatu berriro',
            ttsAchievementUnlocked: 'Lorpena desblokeatuta',
            ttsGameStarted: 'Jokoa hasita',
            ttsGameCompleted: 'Zorionak, erronka osatu duzu',
            ttsStreak: '{streak}ko segida',
            ttsResults: 'Erronka osatu duzu {correct} erantzun zuzenekin {minutes} minutu eta {seconds} segundotan. Zure zehaztasuna ehuneko {accuracy} izan da.',

            // TTS - Eragiketa matematikoak
            ttsMathTimes: 'bider',
            ttsMathDividedBy: 'zati',
            ttsMathPlus: 'gehi',
            ttsMathMinus: 'ken',
            ttsMathEquals: 'berdin',
            ttsMathQuestionMark: 'galdera ikurra',
            ttsMathUnknownX: 'X',

            // Lorpenak
            achievementNames: {
                first_correct: 'Lehen Urratsa',
                streak_5: 'Martxan',
                streak_10: 'Geldiezina',
                perfect_game: 'Perfekzionista',
                games_10: 'Ikasle Eskainia',
                games_50: 'Ikasketa Maisua',
                level_5: 'Eskalatzailea',
                level_10: 'Konkistatzailea',
                speed_demon: 'Abiadura Deabrua',
                all_operations: 'Denetarikoa',
                hundred_correct: 'Ehundarra',
                multiplication_master: 'Taulen Maisua',
                early_bird: 'Goiztiarra',
                night_owl: 'Gaueko Hontza',
                comeback_kid: 'Ez Etsi Inoiz',
                topic_explorer: "Gaien Esploratzailea"
            },
            achievementDescriptions: {
                first_correct: 'Erantzun zuzen zure lehen galdera',
                streak_5: 'Lortu 5 erantzun zuzeneko segida',
                streak_10: 'Lortu 10 erantzun zuzeneko segida',
                perfect_game: 'Osatu partida bat akatsik gabe',
                games_10: 'Osatu 10 partida',
                games_50: 'Osatu 50 partida',
                level_5: 'Osatu partida bat 5. mailan edo gorago',
                level_10: 'Osatu partida bat 10. mailan',
                speed_demon: 'Osatu 20 galdera 2 minutu baino gutxiagoan',
                all_operations: 'Osatu gutxienez eragiketa bakoitzeko partida bat',
                hundred_correct: 'Erantzun zuzen 100 galdera guztira',
                multiplication_master: 'Osatu 10 biderketa taulen partida',
                early_bird: 'Jokatu zure lehen partida goizeko 8ak baino lehen',
                night_owl: 'Jokatu partida bat gaueko 10ak eta gero',
                comeback_kid: 'Irabazi partida bat 3+ pista erabili ondoren',
                topic_explorer: "Jokatu partida bat gai bakoitzean: problemak, zatikiak, ehunekoak, segidak, zer falta da eta berredurak"
            },
            achievementUnlockedTitle: 'Lorpena Desblokeatuta!',

            // Eragiketa adierazleak
            multiplicationTablesAll: 'Biderketa Taulak - Denak',
            tableOfNumber: '{number}ren Taula',
            operationLevel: '{operation} - {level}. Maila',

            // Oina
            signInWithGoogle: 'Sartu Googlerekin',
            signOut: 'Saioa itxi',
            developedBy: 'Games Hub | MathMaster v3.0',

            topicTier: {
                1: "1-3 mailak: ariketa errazak zenbaki txikiekin.",
                2: "4-6 mailak: ariketa ertainak, kalkulu pixka bat gehiago.",
                3: "7-8 mailak: zailak, urrats batzuekin.",
                4: "9-10 mailak: aditu mailakoak, txapeldunentzat!"
            },

            // New topics: tips, review, word problems
            answerWas: "Erantzuna {answer} zen",
            reviewTitle: "Errepasatzeko",
            tipNextLevel: "Partida bikaina! Probatu {level}. maila orain.",
            tipSameLevel: "Oso ondo zoaz. Errepikatu sendotzeko.",
            tipEasierLevel: "Presarik ez. Probatu maila baxuago bat eta errepasatu akatsak.",
            starsLabel: "3 izarretatik {n}",
            problem1: "Anak {a} kromo ditu eta bere lagun Leok {b} gehiago oparitzen dizkio. Zenbat kromo ditu orain?",
            problem2: "Autobus batean {a} pertsona doaz. Geltokian {b} jaisten dira. Zenbat pertsona geratzen dira autobusean?",
            problem3: "Pakete batek {a} galleta ditu. Zenbat galleta daude {b} paketetan?",
            problem4: "{a} euro banatzen dira {b} anai-arreben artean berdin-berdin. Zenbat euro jasotzen ditu bakoitzak?",
            problem5: "Anak {a} koaderno erosten ditu, bakoitza {b} eurotan, eta {c} eurorekin ordaintzen du. Zenbat euro itzultzen dizkiote?",
            problem6: "Leok {a} bola ditu eta Anak Leok baino {b} gehiago. Zenbat bola dituzte bien artean?",
            problem7: "Film batek {h} ordu eta {m} minutu irauten ditu. Zenbat minutu dira guztira?",
            problem8: "Kamiseta batek {a} euro balio du eta %{p}eko deskontua du. Zenbat euro ordaindu behar dira?",
            problem9: "{a} arrautza daude eta kaxa bakoitzean {b} sartzen dira. Zenbat kaxa bete daitezke guztiz?"
        },

        // ==================== GALEGO (gl-ES) ====================
        "gl-ES": {
            appTitle: "MathMaster",
            appSubtitle: "Desafío por Puntuación Fixa",
            loading: "Cargando...",
            backToHub: "Games Hub",
            selectOrCreateProfile: "Selecciona ou crea o teu perfil",
            noSavedProfiles: "Non hai perfís gardados",
            playerNamePlaceholder: "Nome do xogador",
            createProfile: "Crear perfil",
            playAsGuest: "Xogar como convidado",
            created: "Creado",
            deleteProfile: "Eliminar perfil",
            chooseOperation: "Escolle a operación ou o tema",
            difficultyLevel: "Nivel de dificultade",
            questionCount: "Cantidade de preguntas",
            start: "COMEZAR!",
            statistics: "Estatísticas",
            achievements: "Logros",
            operations: {
                suma: "Suma",
                resta: "Resta",
                multiplicacion: "Multiplicación",
                division: "División",
                tablas: "Táboas",
                mezcla: "Mestura",
                problemas: "Problemas",
                fracciones: "Fraccións",
                porcentajes: "Porcentaxes",
                secuencias: "Series",
                huecos: "Que falta",
                potencias: "Potencias"
            },
            levels: {
                1: { name: "Básica e táboas", description: "Sumas/restas de 1 a 10. Resultado sempre positivo. Multiplicación e división con factores de 1 a 10." },
                2: { name: "Números medianos", description: "Sumas/restas de 1 a 100. Resultado sempre positivo. Multiplicación ata 15. División con cociente enteiro." },
                3: { name: "Grandes enteiros", description: "Sumas/restas de 1 a 1.000. Factores de multiplicación ata 30. División con cociente enteiro." },
                4: { name: "Decimais simples", description: "Números ata 10.000 con decimais simples (X.X). División con 1 decimal no resultado." },
                5: { name: "Decimais complexos", description: "Números ata 100.000 con decimais (X.XXX). Multiplicación de números grandes. División con 2 decimais." },
                6: { name: "Números negativos", description: "Suma e resta con números negativos frecuentes (Ex.: -10 + 25). Multiplicación de 3 díxitos. División con 3 decimais." },
                7: { name: "Cadeas de operacións", description: "Cadeas de suma/resta (Ex.: 15 - 8 + 3). Multiplicación de 4x2 díxitos. División con decimais no divisor." },
                8: { name: "4 díxitos / Mestura básica", description: "Operación individual: números de 4 díxitos. Mestura: xerarquía sen parénteses (a×b + c)." },
                9: { name: "5 díxitos / Pre-álxebra", description: "Operación individual: números de 5 díxitos. Mestura: incógnita X coas 4 operacións (X + 15 = 27)." },
                10: { name: "Mestre: grandes números", description: "Operación individual: números moi grandes. Mestura: PEMDAS con parénteses." }
            },
            topicTier: {
                1: "Niveis 1-3: exercicios sinxelos con números pequenos.",
                2: "Niveis 4-6: exercicios medianos, un pouco máis de cálculo.",
                3: "Niveis 7-8: difíciles, con varios pasos.",
                4: "Niveis 9-10: de experto, para campións!"
            },
            selectLevelDescription: "Selecciona un nivel para ver a súa descrición",
            selectLevelDesc: "Selecciona un nivel para ver a súa descrición",
            allTables: "Todas",
            tablesAll: "Táboas de multiplicar - Todas",
            tableOf: "Táboa do {number}",
            operationLevel: "{operation} - Nivel {level}",
            time: "Tempo",
            score: "Puntuación",
            streak: "Racha",
            yourAnswer: "A túa resposta",
            verify: "Verificar",
            pause: "Pausar",
            exit: "Saír",
            readQuestion: "Ler a pregunta en voz alta",
            correct: "Correcto!",
            excellentStreak: "Excelente! Racha de {streak}",
            goodStreak: "Moi ben! Racha de {streak}",
            incorrectTryAgain: "Incorrecto! Téntao de novo",
            enterValidNumber: "Introduce un número válido",
            hintRange: "Pista: é un número entre {min} e {max}",
            hintNegative: "Pista: é un número negativo",
            hintApprox: "Pista: o resultado é aproximadamente {value}",
            gamePaused: "Xogo en pausa",
            answers: "Respostas",
            continue: "Continuar",
            restart: "Reiniciar",
            mainMenu: "Menú principal",
            congratulations: "Parabéns!",
            resultPerfect: "Perfecto!",
            resultExcellent: "Excelente!",
            resultVeryGood: "Moi ben!",
            resultGoodTry: "Bo intento!",
            correctAnswers: "Respostas correctas",
            totalTime: "Tempo total",
            bestStreak: "Mellor racha",
            precision: "Precisión",
            totalAttempts: "Intentos totais",
            avgPerQuestion: "Media por pregunta",
            newTimeRecord: "Novo récord de tempo!",
            achievementsUnlocked: "Logros desbloqueados",
            playAgain: "Xogar de novo",
            back: "Volver",
            generalSummary: "Resumo xeral",
            gamesPlayed: "Partidas xogadas",
            correctAnswersTotal: "Respostas correctas",
            globalPrecision: "Precisión global",
            totalTimeSpent: "Tempo total",
            byOperation: "Por operación",
            games: "partidas",
            corrects: "correctas",
            noGamesYet: "Aínda non xogaches ningunha partida",
            statsGamesCorrect: "{games} partidas / {correct} correctas",
            loginForStats: "Inicia sesión para ver as túas estatísticas",
            settings: "Configuración",
            audio: "Audio",
            soundEffects: "Efectos de son",
            soundEffectsDesc: "Sons para acertos, erros e logros",
            volume: "Volume",
            textToSpeech: "Lectura en voz alta (TTS)",
            textToSpeechDesc: "Le as preguntas e os resultados",
            accessibility: "Accesibilidade",
            highContrastMode: "Modo de alto contraste",
            highContrastDesc: "Mellora a visibilidade para persoas con dificultades visuais",
            language: "Idioma",
            languageDesc: "Selecciona o idioma da interface",
            account: "Conta",
            currentUser: "Usuario actual",
            guest: "Convidado",
            guestNoProgress: "Convidado (sen gardar progreso)",
            change: "Cambiar",
            deleteAccount: "Eliminar conta",
            deleteAccountDesc: "Esta acción non se pode desfacer",
            delete: "Eliminar",
            close: "Pechar",
            myProfile: "O meu perfil",
            logout: "Pechar sesión",
            lastActivity: "Última actividade",
            quickStats: "Resumo rápido",
            viewAllStats: "Ver estatísticas completas",
            viewAllAchievements: "Ver todos os logros",
            areYouSure: "Estás seguro?",
            actionCannotBeUndone: "Esta acción non se pode desfacer.",
            deleteProfileConfirmTitle: "Eliminar perfil?",
            deleteProfileConfirmMessage: "Eliminarase permanentemente o perfil \"{username}\" e todos os seus datos.",
            deleteAccountConfirmTitle: "Eliminar a túa conta?",
            deleteAccountConfirmMessage: "Eliminaranse permanentemente todos os teus datos, estatísticas e logros. Esta acción non se pode desfacer.",
            cancel: "Cancelar",
            confirm: "Confirmar",
            enterUsername: "Introduce un nome de usuario",
            usernameLengthError: "O nome debe ter entre 2 e 20 caracteres",
            usernameExists: "Xa existe un usuario con ese nome",
            loginToViewStats: "Inicia sesión para ver as túas estatísticas",
            ttsCorrect: "Correcto",
            ttsIncorrect: "Incorrecto, téntao de novo",
            ttsAchievementUnlocked: "Logro desbloqueado",
            ttsGameStarted: "Xogo iniciado",
            ttsGameCompleted: "Parabéns, completaches o desafío",
            ttsStreak: "Racha de {streak}",
            ttsResults: "Completaches o desafío con {correct} respostas correctas en {minutes} minutos e {seconds} segundos. A túa precisión foi do {accuracy} por cento.",
            ttsMathTimes: "por",
            ttsMathDividedBy: "dividido entre",
            ttsMathPlus: "máis",
            ttsMathMinus: "menos",
            ttsMathEquals: "igual a",
            ttsMathQuestionMark: "interrogación",
            ttsMathUnknownX: "equis",
            achievementNames: {
                first_correct: "Primeiro paso",
                streak_5: "En racha",
                streak_10: "Imparable",
                perfect_game: "Perfeccionista",
                games_10: "Estudante dedicado",
                games_50: "Mestre do estudo",
                level_5: "Escalador",
                level_10: "Conquistador",
                speed_demon: "Velocista",
                all_operations: "Todoterreo",
                hundred_correct: "Centenario",
                multiplication_master: "Mestre das táboas",
                early_bird: "Madrugador",
                night_owl: "Curuxa nocturna",
                comeback_kid: "Nunca te rindas",
                topic_explorer: "Explorador de temas"
            },
            achievementDescriptions: {
                first_correct: "Responde correctamente a túa primeira pregunta",
                streak_5: "Consegue unha racha de 5 respostas correctas",
                streak_10: "Consegue unha racha de 10 respostas correctas",
                perfect_game: "Completa unha partida sen erros",
                games_10: "Completa 10 partidas",
                games_50: "Completa 50 partidas",
                level_5: "Completa unha partida en nivel 5 ou superior",
                level_10: "Completa unha partida en nivel 10",
                speed_demon: "Completa 20 preguntas en menos de 2 minutos",
                all_operations: "Completa polo menos unha partida de cada operación",
                hundred_correct: "Responde correctamente 100 preguntas en total",
                multiplication_master: "Completa 10 partidas de táboas de multiplicar",
                early_bird: "Xoga a túa primeira partida antes das 8 da mañá",
                night_owl: "Xoga unha partida despois das 10 da noite",
                comeback_kid: "Gaña unha partida despois de usar 3 ou máis pistas",
                topic_explorer: "Xoga unha partida de cada tema: problemas, fraccións, porcentaxes, series, que falta e potencias"
            },
            achievementUnlockedTitle: "Logro desbloqueado!",
            multiplicationTablesAll: "Táboas de multiplicar - Todas",
            tableOfNumber: "Táboa do {number}",
            signInWithGoogle: "Entrar con Google",
            signOut: "Pechar sesión",
            developedBy: "Games Hub | MathMaster v3.0",

            // New topics: tips, review, word problems
            answerWas: "A resposta era {answer}",
            reviewTitle: "Para repasar",
            tipNextLevel: "Gran partida! Proba agora o nivel {level}.",
            tipSameLevel: "Vas moi ben. Repite para afianzalo.",
            tipEasierLevel: "Sen présa. Proba un nivel máis baixo e repasa os teus erros.",
            starsLabel: "{n} de 3 estrelas",
            problem1: "Ana ten {a} cromos e o seu amigo Leo regálalle {b} máis. Cantos cromos ten agora?",
            problem2: "Nun autobús viaxan {a} persoas. Na parada baixan {b}. Cantas persoas quedan no autobús?",
            problem3: "Un paquete ten {a} galletas. Cantas galletas hai en {b} paquetes?",
            problem4: "Repártense {a} euros entre {b} irmáns a partes iguais. Cantos euros recibe cada un?",
            problem5: "Ana compra {a} caderno a {b} euros cada un e paga con {c} euros. Canto diñeiro lle devolven?",
            problem6: "Leo ten {a} bólas e Ana ten {b} máis ca Leo. Cantas bólas teñen entre os dous?",
            problem7: "Unha película dura {h} horas e {m} minutos. Cantos minutos dura en total?",
            problem8: "Unha camiseta custa {a} euros e ten un desconto do {p} %. Cantos euros hai que pagar?",
            problem9: "Hai {a} ovos e cada caixa leva {b}. Cantas caixas se poden encher por completo?"
        },

        // ==================== CATALÀ (ca-ES) ====================
        "ca-ES": {
            appTitle: "MathMaster",
            appSubtitle: "Desafiament per puntuació fixa",
            loading: "Carregant...",
            backToHub: "Games Hub",
            selectOrCreateProfile: "Selecciona o crea el teu perfil",
            noSavedProfiles: "No hi ha perfils desats",
            playerNamePlaceholder: "Nom del jugador",
            createProfile: "Crear perfil",
            playAsGuest: "Jugar com a convidat",
            created: "Creat",
            deleteProfile: "Eliminar perfil",
            chooseOperation: "Tria l'operació o el tema",
            difficultyLevel: "Nivell de dificultat",
            questionCount: "Nombre de preguntes",
            start: "COMENÇAR!",
            statistics: "Estadístiques",
            achievements: "Assoliments",
            operations: {
                suma: "Suma",
                resta: "Resta",
                multiplicacion: "Multiplicació",
                division: "Divisió",
                tablas: "Taules",
                mezcla: "Barreja",
                problemas: "Problemes",
                fracciones: "Fraccions",
                porcentajes: "Percentatges",
                secuencias: "Sèries",
                huecos: "Què falta",
                potencias: "Potències"
            },
            levels: {
                1: { name: "Bàsica i taules", description: "Sumes/restes d'1 a 10. Resultat sempre positiu. Multiplicació i divisió amb factors d'1 a 10." },
                2: { name: "Nombres mitjans", description: "Sumes/restes d'1 a 100. Resultat sempre positiu. Multiplicació fins a 15. Divisió amb quocient enter." },
                3: { name: "Grans enters", description: "Sumes/restes d'1 a 1.000. Factors de multiplicació fins a 30. Divisió amb quocient enter." },
                4: { name: "Decimals simples", description: "Nombres fins a 10.000 amb decimals simples (X.X). Divisió amb 1 decimal al resultat." },
                5: { name: "Decimals complexos", description: "Nombres fins a 100.000 amb decimals (X.XXX). Multiplicació de nombres grans. Divisió amb 2 decimals." },
                6: { name: "Nombres negatius", description: "Suma i resta amb nombres negatius freqüents (Ex.: -10 + 25). Multiplicació de 3 xifres. Divisió amb 3 decimals." },
                7: { name: "Cadenes d'operacions", description: "Cadenes de suma/resta (Ex.: 15 - 8 + 3). Multiplicació de 4x2 xifres. Divisió amb decimals al divisor." },
                8: { name: "4 xifres / Barreja bàsica", description: "Operació individual: nombres de 4 xifres. Barreja: jerarquia sense parèntesis (a×b + c)." },
                9: { name: "5 xifres / Preàlgebra", description: "Operació individual: nombres de 5 xifres. Barreja: incògnita X amb les 4 operacions (X + 15 = 27)." },
                10: { name: "Mestre: grans nombres", description: "Operació individual: nombres molt grans. Barreja: PEMDAS amb parèntesis." }
            },
            topicTier: {
                1: "Nivells 1-3: exercicis senzills amb nombres petits.",
                2: "Nivells 4-6: exercicis mitjans, una mica més de càlcul.",
                3: "Nivells 7-8: difícils, amb diversos passos.",
                4: "Nivells 9-10: d'expert, per a campions!"
            },
            selectLevelDescription: "Selecciona un nivell per veure'n la descripció",
            selectLevelDesc: "Selecciona un nivell per veure'n la descripció",
            allTables: "Totes",
            tablesAll: "Taules de multiplicar - Totes",
            tableOf: "Taula del {number}",
            operationLevel: "{operation} - Nivell {level}",
            time: "Temps",
            score: "Puntuació",
            streak: "Ratxa",
            yourAnswer: "La teva resposta",
            verify: "Verificar",
            pause: "Pausar",
            exit: "Sortir",
            readQuestion: "Llegir la pregunta en veu alta",
            correct: "Correcte!",
            excellentStreak: "Excel·lent! Ratxa de {streak}",
            goodStreak: "Molt bé! Ratxa de {streak}",
            incorrectTryAgain: "Incorrecte! Torna-ho a provar",
            enterValidNumber: "Introdueix un nombre vàlid",
            hintRange: "Pista: és un nombre entre {min} i {max}",
            hintNegative: "Pista: és un nombre negatiu",
            hintApprox: "Pista: el resultat és aproximadament {value}",
            gamePaused: "Joc en pausa",
            answers: "Respostes",
            continue: "Continuar",
            restart: "Reiniciar",
            mainMenu: "Menú principal",
            congratulations: "Felicitats!",
            resultPerfect: "Perfecte!",
            resultExcellent: "Excel·lent!",
            resultVeryGood: "Molt bé!",
            resultGoodTry: "Bon intent!",
            correctAnswers: "Respostes correctes",
            totalTime: "Temps total",
            bestStreak: "Millor ratxa",
            precision: "Precisió",
            totalAttempts: "Intents totals",
            avgPerQuestion: "Mitjana per pregunta",
            newTimeRecord: "Nou rècord de temps!",
            achievementsUnlocked: "Assoliments desbloquejats",
            playAgain: "Jugar de nou",
            back: "Tornar",
            generalSummary: "Resum general",
            gamesPlayed: "Partides jugades",
            correctAnswersTotal: "Respostes correctes",
            globalPrecision: "Precisió global",
            totalTimeSpent: "Temps total",
            byOperation: "Per operació",
            games: "partides",
            corrects: "correctes",
            noGamesYet: "Encara no has jugat cap partida",
            statsGamesCorrect: "{games} partides / {correct} correctes",
            loginForStats: "Inicia sessió per veure les teves estadístiques",
            settings: "Configuració",
            audio: "Àudio",
            soundEffects: "Efectes de so",
            soundEffectsDesc: "Sons per a encerts, errors i assoliments",
            volume: "Volum",
            textToSpeech: "Lectura en veu alta (TTS)",
            textToSpeechDesc: "Llegeix les preguntes i els resultats",
            accessibility: "Accessibilitat",
            highContrastMode: "Mode d'alt contrast",
            highContrastDesc: "Millora la visibilitat per a persones amb dificultats visuals",
            language: "Idioma",
            languageDesc: "Selecciona l'idioma de la interfície",
            account: "Compte",
            currentUser: "Usuari actual",
            guest: "Convidat",
            guestNoProgress: "Convidat (sense desar progrés)",
            change: "Canviar",
            deleteAccount: "Eliminar compte",
            deleteAccountDesc: "Aquesta acció no es pot desfer",
            delete: "Eliminar",
            close: "Tancar",
            myProfile: "El meu perfil",
            logout: "Tancar sessió",
            lastActivity: "Última activitat",
            quickStats: "Resum ràpid",
            viewAllStats: "Veure estadístiques completes",
            viewAllAchievements: "Veure tots els assoliments",
            areYouSure: "Estàs segur?",
            actionCannotBeUndone: "Aquesta acció no es pot desfer.",
            deleteProfileConfirmTitle: "Eliminar perfil?",
            deleteProfileConfirmMessage: "S'eliminarà permanentment el perfil \"{username}\" i totes les seves dades.",
            deleteAccountConfirmTitle: "Eliminar el teu compte?",
            deleteAccountConfirmMessage: "S'eliminaran permanentment totes les teves dades, estadístiques i assoliments. Aquesta acció no es pot desfer.",
            cancel: "Cancel·lar",
            confirm: "Confirmar",
            enterUsername: "Introdueix un nom d'usuari",
            usernameLengthError: "El nom ha de tenir entre 2 i 20 caràcters",
            usernameExists: "Ja existeix un usuari amb aquest nom",
            loginToViewStats: "Inicia sessió per veure les teves estadístiques",
            ttsCorrect: "Correcte",
            ttsIncorrect: "Incorrecte, torna-ho a provar",
            ttsAchievementUnlocked: "Assoliment desbloquejat",
            ttsGameStarted: "Joc iniciat",
            ttsGameCompleted: "Felicitats, has completat el desafiament",
            ttsStreak: "Ratxa de {streak}",
            ttsResults: "Has completat el desafiament amb {correct} respostes correctes en {minutes} minuts i {seconds} segons. La teva precisió ha estat del {accuracy} per cent.",
            ttsMathTimes: "per",
            ttsMathDividedBy: "dividit entre",
            ttsMathPlus: "més",
            ttsMathMinus: "menys",
            ttsMathEquals: "igual a",
            ttsMathQuestionMark: "interrogant",
            ttsMathUnknownX: "equis",
            achievementNames: {
                first_correct: "Primer pas",
                streak_5: "En ratxa",
                streak_10: "Imparable",
                perfect_game: "Perfeccionista",
                games_10: "Estudiant dedicat",
                games_50: "Mestre de l'estudi",
                level_5: "Escalador",
                level_10: "Conqueridor",
                speed_demon: "Velocista",
                all_operations: "Tot terreny",
                hundred_correct: "Centenari",
                multiplication_master: "Mestre de les taules",
                early_bird: "Matinador",
                night_owl: "Mussol nocturn",
                comeback_kid: "Mai et rendeixis",
                topic_explorer: "Explorador de temes"
            },
            achievementDescriptions: {
                first_correct: "Respon correctament la teva primera pregunta",
                streak_5: "Aconsegueix una ratxa de 5 respostes correctes",
                streak_10: "Aconsegueix una ratxa de 10 respostes correctes",
                perfect_game: "Completa una partida sense errors",
                games_10: "Completa 10 partides",
                games_50: "Completa 50 partides",
                level_5: "Completa una partida en nivell 5 o superior",
                level_10: "Completa una partida en nivell 10",
                speed_demon: "Completa 20 preguntes en menys de 2 minuts",
                all_operations: "Completa almenys una partida de cada operació",
                hundred_correct: "Respon correctament 100 preguntes en total",
                multiplication_master: "Completa 10 partides de taules de multiplicar",
                early_bird: "Juga la teva primera partida abans de les 8 del matí",
                night_owl: "Juga una partida després de les 10 de la nit",
                comeback_kid: "Guanya una partida després d'usar 3 o més pistes",
                topic_explorer: "Juga una partida de cada tema: problemes, fraccions, percentatges, sèries, què falta i potències"
            },
            achievementUnlockedTitle: "Assoliment desbloquejat!",
            multiplicationTablesAll: "Taules de multiplicar - Totes",
            tableOfNumber: "Taula del {number}",
            signInWithGoogle: "Entrar amb Google",
            signOut: "Tancar sessió",
            developedBy: "Games Hub | MathMaster v3.0",

            // New topics: tips, review, word problems
            answerWas: "La resposta era {answer}",
            reviewTitle: "Per repassar",
            tipNextLevel: "Gran partida! Prova ara el nivell {level}.",
            tipSameLevel: "Vas molt bé. Repeteix per consolidar-ho.",
            tipEasierLevel: "Sense pressa. Prova un nivell més baix i repassa els teus errors.",
            starsLabel: "{n} de 3 estrelles",
            problem1: "L'Ana té {a} cromos i el seu amic Leo li regala {b} més. Quants cromos té ara?",
            problem2: "En un autobús viatgen {a} persones. A la parada en baixen {b}. Quantes persones queden a l'autobús?",
            problem3: "Un paquet té {a} galetes. Quantes galetes hi ha en {b} paquets?",
            problem4: "Es reparteixen {a} euros entre {b} germans a parts iguals. Quants euros rep cadascun?",
            problem5: "L'Ana compra {a} quaderns a {b} euros cadascun i paga amb {c} euros. Quants diners li tornen?",
            problem6: "En Leo té {a} bales i l'Ana en té {b} més que en Leo. Quantes bales tenen entre els dos?",
            problem7: "Una pel·lícula dura {h} hores i {m} minuts. Quants minuts dura en total?",
            problem8: "Una samarreta costa {a} euros i té un descompte del {p} %. Quants euros cal pagar?",
            problem9: "Hi ha {a} ous i cada caixa en porta {b}. Quantes caixes es poden omplir del tot?"
        },

        // ==================== FRANÇAIS (fr-FR) ====================
        "fr-FR": {
            appTitle: "MathMaster",
            appSubtitle: "Défi à score fixe",
            loading: "Chargement...",
            backToHub: "Games Hub",
            selectOrCreateProfile: "Sélectionne ou crée ton profil",
            noSavedProfiles: "Aucun profil enregistré",
            playerNamePlaceholder: "Nom du joueur",
            createProfile: "Créer un profil",
            playAsGuest: "Jouer en invité",
            created: "Créé",
            deleteProfile: "Supprimer le profil",
            chooseOperation: "Choisis l'opération ou le thème",
            difficultyLevel: "Niveau de difficulté",
            questionCount: "Nombre de questions",
            start: "C'EST PARTI !",
            statistics: "Statistiques",
            achievements: "Succès",
            operations: {
                suma: "Addition",
                resta: "Soustraction",
                multiplicacion: "Multiplication",
                division: "Division",
                tablas: "Tables",
                mezcla: "Mélange",
                problemas: "Problèmes",
                fracciones: "Fractions",
                porcentajes: "Pourcentages",
                secuencias: "Suites",
                huecos: "Le manquant",
                potencias: "Puissances"
            },
            levels: {
                1: { name: "Base et tables", description: "Additions/soustractions de 1 à 10. Résultat toujours positif. Multiplication et division avec des facteurs de 1 à 10." },
                2: { name: "Nombres moyens", description: "Additions/soustractions de 1 à 100. Résultat toujours positif. Multiplication jusqu'à 15. Division à quotient entier." },
                3: { name: "Grands entiers", description: "Additions/soustractions de 1 à 1 000. Facteurs jusqu'à 30. Division à quotient entier." },
                4: { name: "Décimaux simples", description: "Nombres jusqu'à 10 000 avec décimaux simples (X.X). Division avec 1 décimale au résultat." },
                5: { name: "Décimaux complexes", description: "Nombres jusqu'à 100 000 avec décimaux (X.XXX). Multiplication de grands nombres. Division avec 2 décimales." },
                6: { name: "Nombres négatifs", description: "Addition et soustraction avec des nombres négatifs (ex. : -10 + 25). Multiplication à 3 chiffres. Division avec 3 décimales." },
                7: { name: "Enchaînements d'opérations", description: "Enchaînements d'additions/soustractions (ex. : 15 - 8 + 3). Multiplication 4x2 chiffres. Division avec diviseur décimal." },
                8: { name: "4 chiffres / Mélange de base", description: "Opération seule : nombres à 4 chiffres. Mélange : priorités sans parenthèses (a×b + c)." },
                9: { name: "5 chiffres / Pré-algèbre", description: "Opération seule : nombres à 5 chiffres. Mélange : inconnue X avec les 4 opérations (X + 15 = 27)." },
                10: { name: "Maître : grands nombres", description: "Opération seule : très grands nombres. Mélange : priorités avec parenthèses." }
            },
            topicTier: {
                1: "Niveaux 1-3 : exercices simples avec de petits nombres.",
                2: "Niveaux 4-6 : exercices moyens, un peu plus de calcul.",
                3: "Niveaux 7-8 : difficiles, en plusieurs étapes.",
                4: "Niveaux 9-10 : niveau expert, pour les champions !"
            },
            selectLevelDescription: "Sélectionne un niveau pour voir sa description",
            selectLevelDesc: "Sélectionne un niveau pour voir sa description",
            allTables: "Toutes",
            tablesAll: "Tables de multiplication - Toutes",
            tableOf: "Table de {number}",
            operationLevel: "{operation} - Niveau {level}",
            time: "Temps",
            score: "Score",
            streak: "Série",
            yourAnswer: "Ta réponse",
            verify: "Vérifier",
            pause: "Pause",
            exit: "Quitter",
            readQuestion: "Lire la question à voix haute",
            correct: "Correct !",
            excellentStreak: "Excellent ! Série de {streak}",
            goodStreak: "Très bien ! Série de {streak}",
            incorrectTryAgain: "Incorrect ! Réessaie",
            enterValidNumber: "Saisis un nombre valide",
            hintRange: "Indice : c'est un nombre entre {min} et {max}",
            hintNegative: "Indice : c'est un nombre négatif",
            hintApprox: "Indice : le résultat est environ {value}",
            gamePaused: "Jeu en pause",
            answers: "Réponses",
            continue: "Continuer",
            restart: "Recommencer",
            mainMenu: "Menu principal",
            congratulations: "Félicitations !",
            resultPerfect: "Parfait !",
            resultExcellent: "Excellent !",
            resultVeryGood: "Très bien !",
            resultGoodTry: "Bon essai !",
            correctAnswers: "Bonnes réponses",
            totalTime: "Temps total",
            bestStreak: "Meilleure série",
            precision: "Précision",
            totalAttempts: "Essais au total",
            avgPerQuestion: "Moyenne par question",
            newTimeRecord: "Nouveau record de temps !",
            achievementsUnlocked: "Succès débloqués",
            playAgain: "Rejouer",
            back: "Retour",
            generalSummary: "Résumé général",
            gamesPlayed: "Parties jouées",
            correctAnswersTotal: "Bonnes réponses",
            globalPrecision: "Précision globale",
            totalTimeSpent: "Temps total",
            byOperation: "Par opération",
            games: "parties",
            corrects: "correctes",
            noGamesYet: "Tu n'as encore joué aucune partie",
            statsGamesCorrect: "{games} parties / {correct} correctes",
            loginForStats: "Connecte-toi pour voir tes statistiques",
            settings: "Réglages",
            audio: "Audio",
            soundEffects: "Effets sonores",
            soundEffectsDesc: "Sons pour les réussites, les erreurs et les succès",
            volume: "Volume",
            textToSpeech: "Lecture à voix haute (TTS)",
            textToSpeechDesc: "Lit les questions et les résultats",
            accessibility: "Accessibilité",
            highContrastMode: "Mode contraste élevé",
            highContrastDesc: "Améliore la visibilité pour les personnes ayant des difficultés visuelles",
            language: "Langue",
            languageDesc: "Sélectionne la langue de l'interface",
            account: "Compte",
            currentUser: "Utilisateur actuel",
            guest: "Invité",
            guestNoProgress: "Invité (progression non enregistrée)",
            change: "Changer",
            deleteAccount: "Supprimer le compte",
            deleteAccountDesc: "Cette action est irréversible",
            delete: "Supprimer",
            close: "Fermer",
            myProfile: "Mon profil",
            logout: "Se déconnecter",
            lastActivity: "Dernière activité",
            quickStats: "Résumé rapide",
            viewAllStats: "Voir toutes les statistiques",
            viewAllAchievements: "Voir tous les succès",
            areYouSure: "Es-tu sûr ?",
            actionCannotBeUndone: "Cette action est irréversible.",
            deleteProfileConfirmTitle: "Supprimer le profil ?",
            deleteProfileConfirmMessage: "Le profil « {username} » et toutes ses données seront supprimés définitivement.",
            deleteAccountConfirmTitle: "Supprimer ton compte ?",
            deleteAccountConfirmMessage: "Toutes tes données, statistiques et succès seront supprimés définitivement. Cette action est irréversible.",
            cancel: "Annuler",
            confirm: "Confirmer",
            enterUsername: "Saisis un nom d'utilisateur",
            usernameLengthError: "Le nom doit contenir entre 2 et 20 caractères",
            usernameExists: "Un utilisateur porte déjà ce nom",
            loginToViewStats: "Connecte-toi pour voir tes statistiques",
            ttsCorrect: "Correct",
            ttsIncorrect: "Incorrect, réessaie",
            ttsAchievementUnlocked: "Succès débloqué",
            ttsGameStarted: "Jeu commencé",
            ttsGameCompleted: "Félicitations, tu as terminé le défi",
            ttsStreak: "Série de {streak}",
            ttsResults: "Tu as terminé le défi avec {correct} bonnes réponses en {minutes} minutes et {seconds} secondes. Ta précision était de {accuracy} pour cent.",
            ttsMathTimes: "fois",
            ttsMathDividedBy: "divisé par",
            ttsMathPlus: "plus",
            ttsMathMinus: "moins",
            ttsMathEquals: "égale",
            ttsMathQuestionMark: "point d'interrogation",
            ttsMathUnknownX: "x",
            achievementNames: {
                first_correct: "Premier pas",
                streak_5: "En série",
                streak_10: "Imparable",
                perfect_game: "Perfectionniste",
                games_10: "Élève assidu",
                games_50: "Maître de l'étude",
                level_5: "Grimpeur",
                level_10: "Conquérant",
                speed_demon: "Sprinteur",
                all_operations: "Touche-à-tout",
                hundred_correct: "Centenaire",
                multiplication_master: "Maître des tables",
                early_bird: "Lève-tôt",
                night_owl: "Oiseau de nuit",
                comeback_kid: "Ne jamais abandonner",
                topic_explorer: "Explorateur de thèmes"
            },
            achievementDescriptions: {
                first_correct: "Réponds correctement à ta première question",
                streak_5: "Obtiens une série de 5 bonnes réponses",
                streak_10: "Obtiens une série de 10 bonnes réponses",
                perfect_game: "Termine une partie sans aucune erreur",
                games_10: "Termine 10 parties",
                games_50: "Termine 50 parties",
                level_5: "Termine une partie au niveau 5 ou plus",
                level_10: "Termine une partie au niveau 10",
                speed_demon: "Termine 20 questions en moins de 2 minutes",
                all_operations: "Termine au moins une partie de chaque opération",
                hundred_correct: "Réponds correctement à 100 questions au total",
                multiplication_master: "Termine 10 parties de tables de multiplication",
                early_bird: "Joue ta première partie avant 8 h du matin",
                night_owl: "Joue une partie après 22 h",
                comeback_kid: "Gagne une partie après avoir utilisé 3 indices ou plus",
                topic_explorer: "Joue une partie de chaque thème : problèmes, fractions, pourcentages, suites, le manquant et puissances"
            },
            achievementUnlockedTitle: "Succès débloqué !",
            multiplicationTablesAll: "Tables de multiplication - Toutes",
            tableOfNumber: "Table de {number}",
            signInWithGoogle: "Se connecter avec Google",
            signOut: "Se déconnecter",
            developedBy: "Games Hub | MathMaster v3.0",

            // New topics: tips, review, word problems
            answerWas: "La réponse était {answer}",
            reviewTitle: "À revoir",
            tipNextLevel: "Super partie ! Essaie maintenant le niveau {level}.",
            tipSameLevel: "Tu t'en sors très bien. Rejoue pour bien l'ancrer.",
            tipEasierLevel: "Pas de pression. Essaie un niveau plus bas et revois tes erreurs.",
            starsLabel: "{n} étoiles sur 3",
            problem1: "Ana a {a} vignettes et son ami Leo lui en offre {b} de plus. Combien de vignettes a-t-elle maintenant ?",
            problem2: "Dans un bus, il y a {a} personnes. À l'arrêt, {b} descendent. Combien de personnes restent dans le bus ?",
            problem3: "Un paquet contient {a} biscuits. Combien de biscuits y a-t-il dans {b} paquets ?",
            problem4: "On partage {a} euros également entre {b} frères et sœurs. Combien d'euros reçoit chacun ?",
            problem5: "Ana achète {a} cahiers à {b} euros chacun et paie avec {c} euros. Combien lui rend-on ?",
            problem6: "Leo a {a} billes et Ana en a {b} de plus que Leo. Combien de billes ont-ils à eux deux ?",
            problem7: "Un film dure {h} heures et {m} minutes. Combien de minutes cela fait-il en tout ?",
            problem8: "Un T-shirt coûte {a} euros et bénéficie d'une réduction de {p} %. Combien d'euros faut-il payer ?",
            problem9: "Il y a {a} œufs et chaque boîte en contient {b}. Combien de boîtes peut-on remplir complètement ?"
        }
    },

    // ==================== MÉTODOS ====================

    /**
     * Inicializa el sistema de i18n
     */
    init() {
        this.loadLanguage();
    },

    /**
     * Carga el idioma guardado o detecta el del navegador
     */
    loadLanguage() {
        const saved = localStorage.getItem('mathmaster_language');
        const platformLang = (typeof PlatformI18n !== 'undefined') ? PlatformI18n.currentLanguage : null;
        if (platformLang && this.translations[platformLang]) {
            this.currentLanguage = platformLang;
        } else if (saved && this.translations[saved]) {
            this.currentLanguage = saved;
        } else {
            // Detectar idioma del navegador
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('eu')) {
                this.currentLanguage = 'eu-ES';
            } else if (browserLang.startsWith('en')) {
                this.currentLanguage = 'en-US';
            } else if (browserLang.startsWith('gl')) {
                this.currentLanguage = 'gl-ES';
            } else if (browserLang.startsWith('ca')) {
                this.currentLanguage = 'ca-ES';
            } else if (browserLang.startsWith('fr')) {
                this.currentLanguage = 'fr-FR';
            } else {
                this.currentLanguage = 'es-ES';
            }
        }
        this.applyLanguage();
    },

    /**
     * Cambia el idioma actual
     * @param {string} lang - Código de idioma (es-ES, en-US, eu-ES)
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('mathmaster_language', lang);
            this.applyLanguage();

            // Actualizar atributo lang del HTML
            document.documentElement.lang = lang.split('-')[0];

            return true;
        }
        return false;
    },

    /**
     * Obtiene una traducción por clave
     * @param {string} key - Clave de traducción (soporta notación punto: 'operations.suma')
     * @param {Object} params - Parámetros para interpolación
     * @returns {string} Texto traducido
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback a español si no existe la clave
                value = this.translations['es-ES'];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Devolver la clave si no existe
                    }
                }
                break;
            }
        }

        // Interpolación de parámetros
        if (typeof value === 'string' && params) {
            Object.keys(params).forEach(param => {
                value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
            });
        }

        return value || key;
    },

    /**
     * Aplica las traducciones a todos los elementos con data-i18n
     */
    applyLanguage() {
        // Actualizar elementos con data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);

            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = text;
            } else if (el.hasAttribute('title')) {
                el.title = text;
            } else if (el.hasAttribute('aria-label')) {
                el.setAttribute('aria-label', text);
            } else {
                el.textContent = text;
            }
        });

        // Actualizar elementos con data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Actualizar elementos con data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Actualizar elementos con data-i18n-aria
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            el.setAttribute('aria-label', this.t(key));
        });

        // Disparar evento para que otros módulos actualicen sus textos
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    },

    /**
     * Obtiene el nombre de una operación traducido
     * @param {string} operation - Código de operación
     * @returns {string} Nombre traducido
     */
    getOperationName(operation) {
        return this.t(`operations.${operation}`);
    },

    /**
     * Obtiene la descripción de un nivel
     * @param {number} level - Número de nivel
     * @returns {Object} Objeto con name y description traducidos
     */
    getLevelInfo(level) {
        return this.t(`levels.${level}`);
    },

    /**
     * Obtiene el nombre de un logro traducido
     * @param {string} achievementId - ID del logro
     * @returns {string} Nombre traducido
     */
    getAchievementName(achievementId) {
        return this.t(`achievementNames.${achievementId}`);
    },

    /**
     * Obtiene la descripción de un logro traducida
     * @param {string} achievementId - ID del logro
     * @returns {string} Descripción traducida
     */
    getAchievementDescription(achievementId) {
        return this.t(`achievementDescriptions.${achievementId}`);
    },

    /**
     * Obtiene nombre y descripción de un logro traducidos
     * @param {string} achievementId - ID del logro
     * @returns {Object} Objeto con name y description traducidos
     */
    getAchievementInfo(achievementId) {
        return {
            name: this.t(`achievementNames.${achievementId}`),
            description: this.t(`achievementDescriptions.${achievementId}`)
        };
    },

    /**
     * Obtiene el idioma actual
     * @returns {string} Código de idioma actual
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    },

    /**
     * Obtiene la lista de idiomas disponibles
     * @returns {Object} Idiomas disponibles con nombre y bandera
     */
    getAvailableLanguages() {
        return this.availableLanguages;
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    MathMasterI18n.init();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathMasterI18n;
}
