package com.bika.archive.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StringDeserializer;
import java.io.IOException;

/**
 * Trims every incoming JSON string and turns a blank-after-trim value into null, so stray
 * whitespace from copy-paste (a common source of "why doesn't my document number match" support
 * questions) never makes it into the database. Bean Validation (@NotBlank etc.) still runs
 * afterwards, so a required field that's blank after trimming is still rejected -- this only
 * normalizes the input, it doesn't bypass validation.
 */
public class TrimmingStringDeserializer extends StringDeserializer {

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = super.deserialize(p, ctxt);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
