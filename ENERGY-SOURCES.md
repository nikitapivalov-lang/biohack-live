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
