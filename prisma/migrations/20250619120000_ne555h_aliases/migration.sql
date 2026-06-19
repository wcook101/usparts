-- NE555H is a common package variant; link to stocked P/N/D siblings.
INSERT INTO "PartAlias" ("id", "fromMpn", "toMpn", "manufacturer", "source", "confidence", "createdAt") VALUES
  ('alias_ne555h_ne555n', 'NE555H', 'NE555N', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555n_ne555h', 'NE555N', 'NE555H', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555h_ne555p', 'NE555H', 'NE555P', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555p_ne555h', 'NE555P', 'NE555H', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555h_ne555d', 'NE555H', 'NE555D', NULL, 'seed', 1.0, CURRENT_TIMESTAMP),
  ('alias_ne555d_ne555h', 'NE555D', 'NE555H', NULL, 'seed', 1.0, CURRENT_TIMESTAMP)
ON CONFLICT ("fromMpn", "toMpn") DO NOTHING;
