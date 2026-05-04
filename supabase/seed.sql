-- ============================================
-- Seed Data — System Defaults (profile_id = null)
-- ============================================

-- ====== Materials (מחירון חומרי גלם) ======

-- עץ
insert into public.materials (profile_id, category, name, dimension, unit, price_per_unit, supplier, sort_order) values
(null, 'wood', 'קורת אורן', '5×10 ס"מ', 'מ׳', 38, 'נוימן', 1),
(null, 'wood', 'קורת אורן', '5×15 ס"מ', 'מ׳', 52, 'נוימן', 2),
(null, 'wood', 'קורת אורן', '5×20 ס"מ', 'מ׳', 68, 'נוימן', 3),
(null, 'wood', 'עמוד אורן', '15×15 ס"מ', 'מ׳', 78, 'נוימן', 4),
(null, 'wood', 'עמוד אורן', '20×20 ס"מ', 'מ׳', 138, 'נוימן', 5),
(null, 'wood', 'לוח דק אורן', '40×160 מ"מ', 'מ׳', 12, 'נוימן', 6),
(null, 'wood', 'קרש דק אורן', '25 מ"מ עובי', 'מ׳', 18, 'נוימן', 7),
(null, 'wood', 'קרש דק במבוק', '20 מ"מ עובי', 'מ׳', 32, '', 8),
(null, 'wood', 'קרש דק איפאה', '25 מ"מ עובי', 'מ׳', 65, '', 9),
(null, 'wood', 'קרש דק קומרו', '25 מ"מ עובי', 'מ׳', 45, '', 10);

-- ברגים
insert into public.materials (profile_id, category, name, dimension, unit, price_per_unit, supplier, sort_order) values
(null, 'screws', 'ברגי דק אורן', 'חבילת 400 יח׳', 'חבילה', 170, '', 1),
(null, 'screws', 'ברגי דק במבוק', 'חבילת 80 יח׳', 'חבילה', 135, '', 2),
(null, 'screws', 'ברגי BH', 'חבילת 400 יח׳', 'חבילה', 400, '', 3),
(null, 'screws', 'ברגי פרגולה', 'סט לפרויקט', 'סט', 500, '', 4);

-- שמן וגימור
insert into public.materials (profile_id, category, name, dimension, unit, price_per_unit, supplier, sort_order) values
(null, 'oil', 'שמן עץ', '5 ליטר', 'גלון', 400, '', 1),
(null, 'oil', 'צבע עץ', '5 ליטר', 'גלון', 350, '', 2);

-- זפת
insert into public.materials (profile_id, category, name, dimension, unit, price_per_unit, supplier, sort_order) values
(null, 'tar', 'זפת', '15 ק"ג', 'דלי', 162, '', 1);

-- בטון
insert into public.materials (profile_id, category, name, dimension, unit, price_per_unit, supplier, sort_order) values
(null, 'concrete', 'שק בטון', '25 ק"ג', 'שק', 30, '', 1),
(null, 'concrete', 'אקרשטיין', 'יחידה', 'יח׳', 3, '', 2);

-- אחר
insert into public.materials (profile_id, category, name, dimension, unit, price_per_unit, supplier, sort_order) values
(null, 'other', 'תושבת קיר', 'ליחידה', 'יח׳', 25, '', 1),
(null, 'other', 'תושבת עמוד', 'ליחידה', 'יח׳', 35, '', 2);


-- ====== Calc Rules (כללי חישוב) ======

insert into public.calc_rules (profile_id, rule_key, value, label, help_text, unit, min_value, max_value, category, sort_order) values
-- פרגולה
(null, 'pergola_beam_spacing', 60, 'ריווח קורות גג פרגולה', 'המרחק בין קורות הגג. ריווח קטן = יותר קורות = יקר יותר', 'ס"מ', 40, 100, 'pergola', 1),
(null, 'pergola_post_height', 300, 'גובה עמוד ברירת מחדל', 'גובה סטנדרטי לעמוד פרגולה', 'ס"מ', 200, 400, 'pergola', 2),
(null, 'pergola_post_size', 15, 'חתך עמוד ברירת מחדל', '15 = עמוד 15×15, 20 = עמוד 20×20', 'ס"מ', 15, 20, 'pergola', 3),
(null, 'pergola_screws_set', 500, 'עלות ברגים לפרגולה', 'סט ברגים לפרגולה ממוצעת', '₪', 300, 800, 'pergola', 4),
(null, 'pergola_oil_per_unit', 1, 'גלונות שמן לפרגולה', 'כמה גלונות שמן 5L לפרגולה אחת', 'גלונות', 0.5, 3, 'pergola', 5),
(null, 'pergola_work_days', 2.5, 'ימי עבודה לפרגולה', 'ממוצע ימי עבודה לפרגולה סטנדרטית', 'ימים', 1, 5, 'pergola', 6),
(null, 'pergola_wall_bracket', 1, 'תושבת קיר לקורת תשתית', 'כל קורת תשתית מקבלת תושבת קיר אחת', 'יח׳/קורה', 0, 2, 'pergola', 7),

-- דק
(null, 'deck_joist_spacing_thin', 40, 'ריווח תשתית — קרש דק (2 ס"מ)', 'לקרש עובי ~2 ס"מ (במבוק, סוקופירה)', 'ס"מ', 30, 60, 'deck', 10),
(null, 'deck_joist_spacing_thick', 60, 'ריווח תשתית — קרש עבה (3 ס"מ)', 'לקרש עובי ~3 ס"מ (אורן, איפאה, קומרו)', 'ס"מ', 40, 80, 'deck', 11),
(null, 'deck_screws_per_sqm', 37.5, 'ברגים למ"ר דק', 'ממוצע 35-40 ברגים למ"ר', 'יח׳/מ"ר', 30, 50, 'deck', 12),
(null, 'deck_screws_extra_pct', 10, 'תוספת בטחון ברגים', 'אחוז תוספת לברגים מעבר לחישוב', '%', 5, 20, 'deck', 13),
(null, 'deck_work_days_per_sqm', 0.1, 'ימי עבודה למ"ר דק', '0.1 = 10 מ"ר ביום', 'ימים/מ"ר', 0.05, 0.2, 'deck', 14),
(null, 'deck_critical_height', 30, 'גובה קריטי', 'מעל גובה זה — צריך תשתית מחוזקת', 'ס"מ', 20, 50, 'deck', 15),
(null, 'deck_pine_board_length', 360, 'אורך לוח אורן', 'אורך סטנדרטי של לוח דק אורן', 'ס"מ', 300, 600, 'deck', 16),
(null, 'deck_bamboo_board_length', 185, 'אורך לוח במבוק', 'אורך סטנדרטי של לוח דק במבוק', 'ס"מ', 150, 250, 'deck', 17),
(null, 'deck_tar_coverage', 250, 'כיסוי זפת', 'כמה מ"ר מכסה דלי זפת 15 ק"ג', 'מ"ר', 100, 400, 'deck', 18),

-- כללי
(null, 'overhead_pct', 15, 'אחוז תקורה', 'רכב, כלים, ביטוח, הוצאות קבועות', '%', 5, 30, 'general', 20),
(null, 'profit_pct', 25, 'אחוז רווח', 'אחוז רווח על כל פרויקט', '%', 10, 50, 'general', 21),
(null, 'vat_pct', 17, 'אחוז מע"מ', 'מע"מ ישראלי נוכחי', '%', 0, 20, 'general', 22),
(null, 'concrete_bags_per_footing_low', 0, 'שקי בטון — גובה נמוך', 'כמה שקי בטון לרגל בגובה נמוך', 'שקים', 0, 5, 'general', 23),
(null, 'concrete_bags_per_footing_mid', 2.5, 'שקי בטון — גובה בינוני', 'כמה שקי בטון לרגל בגובה בינוני', 'שקים', 0, 5, 'general', 24),
(null, 'concrete_bags_per_footing_high', 3.5, 'שקי בטון — גובה גבוה', 'כמה שקי בטון לרגל בגובה גבוה', 'שקים', 0, 10, 'general', 25);


-- ====== Engineering Tables ======

-- ספן → חתך קורה
insert into public.engineering_tables (profile_id, table_type, condition_value, result_value, sort_order) values
(null, 'span_to_beam', 100, '5×10', 1),
(null, 'span_to_beam', 155, '5×15', 2),
(null, 'span_to_beam', 200, '5×20', 3);

-- עובי קרש → ריווח ג'ויסטים
insert into public.engineering_tables (profile_id, table_type, condition_value, result_value, sort_order) values
(null, 'thickness_to_spacing', 20, '40', 1),
(null, 'thickness_to_spacing', 25, '60', 2);


-- ====== Work Types (סוגי עבודה מובנים) ======

insert into public.work_types (profile_id, name, icon, calc_method, is_builtin, sort_order) values
(null, 'פרגולה', 'fence', 'sqm', true, 1),
(null, 'דק', 'layers', 'sqm', true, 2),
(null, 'גדר עץ', 'columns', 'sqm', true, 3),
(null, 'חיפוי קירות', 'panel-right', 'sqm', true, 4),
(null, 'מדרגות עץ', 'stairs', 'unit', true, 5),
(null, 'חידוש דק', 'paint-roller', 'sqm', true, 6),
(null, 'ריהוט גן', 'armchair', 'hours', true, 7);
