import { decision as d, stage as st } from "./companion-stories";
import type { StoryChain } from "./story-types";

export const ROUTE_FACTIONS = {
  roots: "The Rootkeepers",
  frost: "The Frostwardens",
  forge: "The Cinder Union",
  crypt: "The Quiet Court",
};
export const ROUTE_STORIES: StoryChain[] = [
  {
    id: "route.roots",
    category: "route",
    route: "roots",
    title: "The Rootkeepers’ borrowed spring",
    stages: [
      st(
        "roots.water",
        "A spring with two owners",
        "Rootkeeper Ina guards a spring on Floor 5. Her people diverted it to keep the upper gardens alive, leaving a lower settlement dry. She offers herbs if you destroy the old diversion record; she fears retaliation if it is read.",
        "field",
        5,
        [
          d(
            "Preserve the record and propose shared water",
            "Ina lets you copy the diversion marks. She will meet the lower settlement if its history is allowed to remain true.",
            { faction: "roots", standing: 2 },
          ),
          d(
            "Sell the record to the upper garden’s patrons",
            "The patrons buy the only written challenge to their water claim. Ina’s settlement keeps its spring, and its silence.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 80,
              faction: "roots",
              standing: -3,
            },
          ),
        ],
      ),
      {
        ...st(
          "roots.channel",
          "The buried channel",
          "In the sixth-floor sanctuary, roots fill an older channel wide enough to serve both settlements. Clearing its gate would leave the upper gardens short for one growing season. Ina asks for witnesses before taking that risk.",
          "field",
          6,
          [
            d(
              "Record a shared season of reduced water",
              "Both settlements mark the agreement. The sacrifice is named and shared, rather than hidden in a missing ledger.",
              { faction: "roots", standing: 3 },
            ),
            d(
              "Reserve the channel for your future expeditions",
              "A private supply promise buys your support. The lower settlement remains outside the agreement.",
              {
                id: "reserve",
                approved: false,
                harmful: true,
                gold: 90,
                faction: "roots",
                standing: -3,
              },
            ),
          ],
        ),
        site: "shelter",
      },
      {
        ...st(
          "roots.charter",
          "A charter beneath the arch",
          "The seventh-floor arch can hold the settlements’ water charter where every expedition will see it. Ina can sign a shared claim or a guarded concession to the companies wealthy enough to pay.",
          "field",
          7,
          [
            d(
              "Witness the shared charter",
              "The Rootkeepers accept a duty to both settlements. Ina gives your party a rootbound mantle woven from the first shared harvest.",
              { item: "root-mantle", faction: "roots", standing: 5 },
            ),
            d(
              "Back the paid concession",
              "The companies advance their fee. The spring’s history is now a condition in a contract few residents can read.",
              {
                id: "concession",
                approved: false,
                harmful: true,
                gold: 180,
                faction: "roots",
                standing: -4,
              },
            ),
          ],
        ),
        site: "portal",
      },
    ],
    aftermath:
      "The Rootkeepers’ water claim has a permanent settlement. Its charter reflects your route decisions.",
  },
  {
    id: "route.frost",
    category: "route",
    route: "frost",
    title: "The Frostwardens’ thaw",
    stages: [
      st(
        "frost.bell",
        "The bell that orders winter",
        "Warden Rusk keeps the fifth-floor thaw bell silent. An early thaw would free trapped workers but crack the wardens’ ice reservoir. He asks you to carry their names to the upper council before anyone decides for them.",
        "field",
        5,
        [
          d(
            "Carry the workers’ names to the council",
            "Rusk gives you the roll. The council will have to speak about people, not merely a reservoir’s capacity.",
            { faction: "frost", standing: 2 },
          ),
          d(
            "Sell the thaw schedule to private salvagers",
            "The salvagers prepare to collect what the thaw exposes. The trapped workers do not learn when rescue might come.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 80,
              faction: "frost",
              standing: -3,
            },
          ),
        ],
      ),
      {
        ...st(
          "frost.witness",
          "A witness in the ice",
          "The sixth-floor shelter holds a frozen maintenance log. It proves the reservoir can drain in stages, if the wardens surrender their private reserve first. Rusk asks you to read the order publicly.",
          "field",
          6,
          [
            d(
              "Read the staged thaw order to every crew",
              "The private reserve opens before the workers’ tunnels. Rusk signs the same ration sheet as the people waiting for rescue.",
              { faction: "frost", standing: 3 },
            ),
            d(
              "Keep the private reserve as payment for your help",
              "Your company receives a valuable credit. The public thaw begins with less water and more mistrust.",
              {
                id: "reserve",
                approved: false,
                harmful: true,
                gold: 90,
                faction: "frost",
                standing: -3,
              },
            ),
          ],
        ),
        site: "shelter",
      },
      {
        ...st(
          "frost.thaw",
          "The first lawful thaw",
          "At the open seventh-floor portal, a new bell charter gives workers a vote on the thaw. The old council offers a concession if you leave authority with the families that own the reservoir.",
          "field",
          7,
          [
            d(
              "Witness the workers’ bell charter",
              "The Frostwardens ring a thaw chosen by those who bear its risk. Rusk gives you a glacierglass blade made from the first safe melt.",
              { item: "glacier-blade", faction: "frost", standing: 5 },
            ),
            d(
              "Support the old council’s concession",
              "The council pays for an orderly signature. The bell remains beyond the workers’ reach.",
              {
                id: "concession",
                approved: false,
                harmful: true,
                gold: 180,
                faction: "frost",
                standing: -4,
              },
            ),
          ],
        ),
        site: "portal",
      },
    ],
    aftermath:
      "The Frostwardens’ thaw has a settled authority. The bell charter records who received a voice.",
  },
  {
    id: "route.forge",
    category: "route",
    route: "forge",
    title: "The Cinder Union’s last shift",
    stages: [
      st(
        "forge.wages",
        "Wages paid in heat",
        "Union keeper Venn shows you a fifth-floor furnace docket. Workers are paid in tokens redeemable only at the furnace owner’s shop. The docket lists a cooling gate that could make the route safer, if production stops for a shift.",
        "field",
        5,
        [
          d(
            "Carry the cooling petition with the wage docket",
            "Venn adds the names of the workers willing to lose a shift’s pay. Their demand is a safer return, not a richer furnace.",
            { faction: "forge", standing: 2 },
          ),
          d(
            "Sell the petition to the furnace owner",
            "The owner pays to identify the organizers. The cooling gate remains a line on an unopened docket.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 80,
              faction: "forge",
              standing: -3,
            },
          ),
        ],
      ),
      {
        ...st(
          "forge.shift",
          "The shift that does no work",
          "The sixth-floor sanctuary contains the cooling mechanism’s manual. The owner calls it sabotage; the manual calls it scheduled maintenance. Venn asks you to hold the manual while the crew votes.",
          "field",
          6,
          [
            d(
              "Read the maintenance schedule before the vote",
              "The crew stops the furnace together. The cooling gate opens under a procedure older than the owner’s claim.",
              { faction: "forge", standing: 3 },
            ),
            d(
              "Trade the manual for a private furnace credit",
              "Your credit is honoured. The next crew will have to argue about sabotage without the manual that could settle it.",
              {
                id: "credit",
                approved: false,
                harmful: true,
                gold: 90,
                faction: "forge",
                standing: -3,
              },
            ),
          ],
        ),
        site: "shelter",
      },
      {
        ...st(
          "forge.contract",
          "A contract for returning",
          "Beyond the seventh-floor defender, the Cinder Union can post a contract guaranteeing maintenance and wages spendable outside the furnace. The owner offers an exclusive supply concession if the old token system remains.",
          "field",
          7,
          [
            d(
              "Witness the union’s return contract",
              "The last shift leaves with wages and a safe passage. Venn gives you a cinderheart charm forged after the cooling gate opened.",
              { item: "ember-charm", faction: "forge", standing: 5 },
            ),
            d(
              "Take the exclusive concession",
              "Your supply terms improve. The workers still leave each shift owing the furnace shop.",
              {
                id: "concession",
                approved: false,
                harmful: true,
                gold: 180,
                faction: "forge",
                standing: -4,
              },
            ),
          ],
        ),
        site: "portal",
      },
    ],
    aftermath:
      "The Cinder Union’s labour dispute has a permanent contract. The cooling gate’s history reflects your decisions.",
  },
  {
    id: "route.crypt",
    category: "route",
    route: "crypt",
    title: "The Quiet Court’s unnamed dead",
    stages: [
      st(
        "crypt.names",
        "A court without petitioners",
        "Archivist Sen tends a fifth-floor register of the dead. The Quiet Court grants protection only to names entered before burial. Hundreds were omitted when a keeper sold the ink allowance to a noble household.",
        "field",
        5,
        [
          d(
            "Copy the omitted names from the burial cloths",
            "Sen brings fresh cloth and reads each name aloud. The register can finally be corrected without inventing a noble sponsor.",
            { faction: "crypt", standing: 2 },
          ),
          d(
            "Sell the omissions to the household’s rivals",
            "The rivals buy a scandal. The omitted dead remain unnamed in the only register the court recognizes.",
            {
              id: "sell",
              approved: false,
              harmful: true,
              gold: 80,
              faction: "crypt",
              standing: -3,
            },
          ),
        ],
      ),
      {
        ...st(
          "crypt.ink",
          "Ink for those who could not pay",
          "In the sixth-floor sanctuary, an earlier charter says the court’s protection precedes its register. Sen can invoke it, but doing so would end the household’s profitable monopoly over memorial ink.",
          "field",
          6,
          [
            d(
              "Read the earlier charter into the record",
              "The court’s own oldest words protect the omitted dead. Sen writes the correction in ordinary ink, refusing the monopoly’s seal.",
              { faction: "crypt", standing: 3 },
            ),
            d(
              "Accept a memorial licence for your company alone",
              "Your company’s names will be protected. The licence leaves everyone else waiting at the same closed register.",
              {
                id: "licence",
                approved: false,
                harmful: true,
                gold: 90,
                faction: "crypt",
                standing: -3,
              },
            ),
          ],
        ),
        site: "shelter",
      },
      {
        ...st(
          "crypt.judgment",
          "The quiet judgment",
          "The open seventh-floor arch holds the court’s public tablet. Sen asks you to witness a judgment restoring protection to the unnamed. The household offers a private concession to preserve its old privilege.",
          "field",
          7,
          [
            d(
              "Witness the judgment for the unnamed",
              "The Quiet Court closes the register only after the last omitted name is read. Sen gives you a wardkeeper’s seal without a patron’s mark.",
              { item: "hollow-ward", faction: "crypt", standing: 5 },
            ),
            d(
              "Take the household’s concession",
              "The payment carries the household seal. Sen leaves a blank line in the public tablet where your witness should have stood.",
              {
                id: "concession",
                approved: false,
                harmful: true,
                gold: 180,
                faction: "crypt",
                standing: -4,
              },
            ),
          ],
        ),
        site: "portal",
      },
    ],
    aftermath:
      "The Quiet Court has issued its judgment. The public tablet records who received protection and who stood as witness.",
  },
];
