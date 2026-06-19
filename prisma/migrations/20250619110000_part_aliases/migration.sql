-- CreateTable
CREATE TABLE "PartAlias" (
    "id" TEXT NOT NULL,
    "fromMpn" TEXT NOT NULL,
    "toMpn" TEXT NOT NULL,
    "manufacturer" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual_admin',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartAlias_fromMpn_toMpn_key" ON "PartAlias"("fromMpn", "toMpn");

-- CreateIndex
CREATE INDEX "PartAlias_fromMpn_idx" ON "PartAlias"("fromMpn");

-- CreateIndex
CREATE INDEX "PartAlias_toMpn_idx" ON "PartAlias"("toMpn");

-- Seed common cross-reference pairs (normalized MPNs)
INSERT INTO "PartAlias" ("id", "fromMpn", "toMpn", "manufacturer", "source", "confidence", "createdAt") VALUES
  ('alias_ne555p_ne555n', 'NE555P', 'NE555N', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555n_ne555p', 'NE555N', 'NE555P', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555p_ne555d', 'NE555P', 'NE555D', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555d_ne555p', 'NE555D', 'NE555P', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555n_ne555d', 'NE555N', 'NE555D', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555d_ne555n', 'NE555D', 'NE555N', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555_ne555n', 'NE555', 'NE555N', NULL, 'seed', 0.9, CURRENT_TIMESTAMP),
  ('alias_ne555_ne555p', 'NE555', 'NE555P', NULL, 'seed', 0.9, CURRENT_TIMESTAMP),
  ('alias_lm358n_lm358d', 'LM358N', 'LM358D', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_lm358d_lm358n', 'LM358D', 'LM358N', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_lm358n_lm358', 'LM358N', 'LM358', NULL, 'seed', 0.9, CURRENT_TIMESTAMP),
  ('alias_lm358_lm358n', 'LM358', 'LM358N', NULL, 'seed', 0.9, CURRENT_TIMESTAMP),
  ('alias_1n4148_1n914', '1N4148', '1N914', NULL, 'seed', 0.95, CURRENT_TIMESTAMP),
  ('alias_1n914_1n4148', '1N914', '1N4148', NULL, 'seed', 0.95, CURRENT_TIMESTAMP),
  ('alias_2n2222a_2n2222', '2N2222A', '2N2222', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_2n2222_2n2222a', '2N2222', '2N2222A', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_bc547_bc547b', 'BC547', 'BC547B', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_bc547b_bc547', 'BC547B', 'BC547', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_tip41c_tip41', 'TIP41C', 'TIP41', NULL, 'seed', 0.9, CURRENT_TIMESTAMP),
  ('alias_tip41_tip41c', 'TIP41', 'TIP41C', NULL, 'seed', 0.9, CURRENT_TIMESTAMP),
  ('alias_ua741cn_ua741', 'UA741CN', 'UA741', NULL, 'seed', 0.95, CURRENT_TIMESTAMP),
  ('alias_ua741_ua741cn', 'UA741', 'UA741CN', NULL, 'seed', 0.95, CURRENT_TIMESTAMP),
  ('alias_atmega328ppu_atmega328p', 'ATMEGA328PP', 'ATMEGA328P', NULL, 'seed', 0.95, CURRENT_TIMESTAMP),
  ('alias_atmega328p_atmega328ppu', 'ATMEGA328P', 'ATMEGA328PP', NULL, 'seed', 0.95, CURRENT_TIMESTAMP);
