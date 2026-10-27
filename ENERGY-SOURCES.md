# Energy metabolism lesson

The original BioHack vector diagrams and Russian explanations cover dietary starch → intestinal absorption → portal circulation/liver → cellular glucose uptake → cytosolic glycolysis → mitochondrial pyruvate oxidation → TCA cycle → electron transport → ATP synthase. This is a human glucose-oxidation example, not every fuel or every organism.

## User-provided sources inspected

All PDFs were read from the user's Desktop/биология folder; PDF files and textbook figures are not redistributed with the website. Page references below are physical PDF pages and can differ from printed page numbers.

- **Энергетический обмен** (NeoFamily), PDF pp. 1–9: school definitions, three-stage model, glycolysis and conditional 38 ATP balance.
- **ENERGETIChESKII_774_OBMEN**, PDF pp. 1–9: school-level catabolism, fermentation and energy accounting.
- **Taylor, Green & Stout, Биология**, vol. 1 (2013), PDF pp. 346–354: cellular respiration, NAD, glycolysis, link reaction, TCA and historical ATP accounting. Volumes 2 and 3 were searched for physiological context and index references.
- **Биологическая химия, под ред. Е. С. Северина**, chapters 6–8, PDF pp. 117–130 and 147–178: respiratory complexes and cofactors, chemiosmosis, carbohydrate transport, glycolysis, shuttles and regulation.
- **Lippincott Illustrated Reviews: Biochemistry**, supplied English PDF, chapters 6–9. Relevant PDF pp. 227–252 (respiratory chain, ATP synthase; figure 6.13 visually inspected on PDF p. 241), pp. 294–328 (glucose transport and glycolysis), pp. 332–348 (PDH and TCA). The eight-subunit mammalian c-ring and three ATP per complete rotor turn follow the explanation associated with figure 6.14, PDF p. 242.

## Additional verified sources

- [ATP synthase: From sequence to ring size to the P/O ratio](https://pmc.ncbi.nlm.nih.gov/articles/PMC2947903/): historical 3/2 versus conventional approximate 2.5/1.5 ATP yields, and energetic costs of transport. Modern ratios and real yields are not fixed universal constants.
- [The Mitochondrion — Molecular Biology of the Cell](https://www.ncbi.nlm.nih.gov/books/NBK26894/): overall ATP production, compartmental transport and different electron entry routes.
- [Insulin Biosynthesis, Secretion, Structure, and Structure-Activity Relationships — Endotext](https://www.ncbi.nlm.nih.gov/books/NBK279029/): GLUT-mediated facilitated diffusion, insulin-dependent GLUT4 translocation and sodium-dependent transport.
- [Intestinal absorption in health and disease — sugars](https://pubmed.ncbi.nlm.nih.gov/14642859/): apical SGLT1 and distinct glucose versus fructose transport.
- [OpenStax Biology 2e, 7.2 Glycolysis](https://openstax.org/books/biology-2e/pages/7-2-glycolysis): the ten reaction sequence, aldolase products, NAD⁺ reduction, substrate-level ATP formation and net ATP yield.

## Explicit simplifications and corrections

- Only the starch component of food is followed. Other nutrients do not all turn into glucose.
- Insulin is an extracellular signal. The muscle/adipose GLUT4 vesicle reaches the membrane before glucose crosses it. Liver and brain options use insulin-independent GLUT pathways. Energetic costs of digestion, absorption and membrane trafficking are outside the per-glucose cellular oxidation ledger.
- Glycolysis produces two pyruvates, not acetyl-CoA. Pyruvate crosses into the mitochondrion; PDH produces acetyl-CoA in the matrix.
- Glycolysis: 2 ATP invested, 4 ATP produced, net 2 ATP and 2 NADH. The detailed level contains ten enzyme-catalyzed reactions, elemental formulas and condensed structural representations. Formulas are specified in their acid forms; cellular protonation states differ. Structural P denotes a phosphate group.
- PDH per glucose: 2 acetyl-CoA, 2 NADH, 2 CO2; no direct ATP.
- TCA: the eight-reaction diagram depicts one turn while counters explicitly account for two turns per glucose: 6 NADH, 2 FADH2 equivalents, 2 GTP/ATP equivalents, 4 CO2. Succinate dehydrogenase is complex II in the inner membrane and its FAD is enzyme-bound. Oxaloacetate regenerates. CO2 carbon identities are not asserted to be the newly entering acetyl carbons in the first turn.
- Electron transport: complexes I/III/IV pump 4/4/2 H+ per electron pair; II pumps none. Q links I or II to III, cytochrome c links III to IV. Electron trajectories bypass II on the NADH route. Two electron dots represent a pair; cytochrome c carries individual electrons. This spatial animation is schematic, not a kinetic or complete Q-cycle simulation.
- Oxygen is reduced to water at IV. Water-formation protons are distinct from protons pumped across the membrane. Electrons do not flow through ATP synthase.
- ATP-synthase animation is a separate idealized c8 rotor cycle: eight modeled proton crossings cause 360° rotation and three ATP outputs, counted at 120° increments. It is not the yield of one NADH. The alpha subunits and atomic half-channel geometry are omitted; beta shape/state changes, stator, membrane rotor and gamma rotation are emphasized.
- The school 38 ATP model (3 per NADH, 2 per FADH2) is kept separate from approximate modern 32 ATP (malate-aspartate shuttle) and 30 ATP (glycerol-3-phosphate shuttle) models. Carriers are counted before they are oxidized; their ATP contribution is added once. Total carrier outputs are 10 NADH (2 cytosolic + 8 matrix) and 2 TCA FADH2 equivalents.

## Validation

`node --test energy-test.mjs` checks navigation/levels, ten glycolytic reactions and ATP investments/returns, two-turn TCA accounting, 38/32/30 balance variants, rotor-angle-linked ATP counts, persistent proton SVG nodes, GLUT4 insertion before glucose entry, I/II entry paths and H+ totals, scrub/step/reset/pause, local zoom and expanded-view escape.

Browser review covers direct lesson URLs, catalog entry, light/dark themes, desktop, narrow viewport, large-view fit and controls inside the expanded view. The new lesson adds no runtime network dependency and retains the existing lesson/note/shared-scene infrastructure.

The two explanation levels also change the diagrams themselves: the EGE TCA overview groups the purpose into four stages, whereas the advanced diagram shows all eight intermediates; advanced glycolysis displays each enzyme-catalyzed transformation with carbon counts and formulas. In aldolase cleavage, six carbons produce two three-carbon molecules; the subsequent triose-isomerase diagram shows one DHAP-to-GAP conversion while noting the total pool of two GAP molecules. Completed reaction markers remain at the product.

Large-view controls remain inside each diagram, the fit command measures both available width and height, focus stays within the expanded view, and leaving the screen restores page scrolling. Zoom is per diagram; students also retain the existing independent shared-scene viewport controls.


## Повторная оценка учебной подачи — 25 октября 2026

Сохранены локализация процессов, ферменты и балансы. Добавлены пояснения текущего действия и счётчики внутри увеличенного просмотра; смысловые контрольные точки для режима ЕГЭ; условный накопительный баланс одной глюкозы без повторного учёта АТФ переносчиков. Цитохром c переносит электроны последовательно, а не парой. Цветовая легенда разделяет электроны и протоны.

Сравнение сопряжённого синтеза и обходного потока H⁺ иллюстрирует разобщение: поток вне F₀ не вращает ротор и не производит АТФ в показанном примере. Опора: Lippincott, раздел о сопряжении и разобщении окислительного фосфорилирования (страницы PDF 241–243). Это не кинетическая модель и не выход АТФ на глюкозу.

Остаются ограничения: кружки C — счёт углеродов, не молекулярная геометрия; полный Q-цикл, внутренние центры комплексов и челноки не анимированы. Расширенный режим пока не заменяет вузовское изучение механизмов. Анализ с позиций учащихся — экспертная оценка, не результат пользовательского исследования.


## Структурные схемы реакций
Гликолиз показан по одной реакции, с открытыми сокращёнными структурными формулами сахаров; стереохимия не обозначена. Фосфат P обозначает группу, а не атом. Для карбоновых кислот в схемах используется COO⁻; справочные брутто-формулы в тексте приведены для кислот. Удвоение реакций 6–10 учитывается в подписях и балансе. Цикл сохраняет круговую последовательность; отдельное увеличение синхронно показывает активную реакцию, фермент, входящие и выходящие вещества. Для сукцинатдегидрогеназы показан конечный перенос на Q; связанный FAD поясняется отдельно.


## Переработка пищеварения — 26 октября 2026

Повторно прочитаны предоставленные файлы из Desktop/биология: «учебник Северин.pdf», физические PDF-страницы 141 и 143 (переваривание углеводов); Lippincott, PDF-страницы 265–268, разделы 7.A–D и подпись к рис. 7.9.

Отдельно показаны: слюнная α-амилаза, постепенная инактивация в желудке (активность может сохраняться внутри комка), панкреатическая α-амилаза в просвете тонкой кишки после нейтрализации кислоты, мальтаза–глюкоамилаза и сахараза–изомальтаза щёточной каймы, SGLT1/GLUT2 и воротная кровь. Амилазы не расщепляют α(1→6) и не завершают гидролиз до свободной глюкозы; продукты показаны как мальтоза, мальтотриоза и предельные декстрины. Олигосахариды изображены условными фрагментами, а не атомными формулами или полным стехиометрическим балансом. Иллюстрации оригинальные, изображения учебников не копировались.


ЦТК: движение функциональных групп показано схематично; Pi переносится через сукцинилфосфат и фосфогистидин на концевой фосфат ГДФ. Структурные источники: https://pmc.ncbi.nlm.nih.gov/articles/PMC4528943/ и https://pmc.ncbi.nlm.nih.gov/articles/PMC7919408/.


Дыхательная цепь: внутренние пути FMN/Fe–S, Q-цикл и CuA → гем a → a3/CuB показаны условно. Источники: https://pmc.ncbi.nlm.nih.gov/articles/PMC3311377/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8361435/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC4343153/ . Визуальный референс приближения к белковым комплексам: Harvard Online, https://www.youtube.com/watch?v=LQmTKxI4Wn4 .


Упрощённый режим дыхательной цепи: последовательность объяснения сверена с Dirty Medicine, https://www.youtube.com/watch?v=LsRQ5_EmxJA (разделы 2:03–12:31). Рисунки и текст оригинальные. FAD показан связанным с комплексом II; свободные ионы кислорода не изображаются.
