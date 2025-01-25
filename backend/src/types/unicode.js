export const characters_to_nfkc_binary = (characters) => {
    return characters
        .normalize("NFKC")
        // .split("")
        // .map((char) => char.codePointAt(0));
};

export const characters_to_nfc_binary = (characters) => {
    return characters
        .normalize("NFC")
        // .split("")
        // .map((char) => char.codePointAt(0));
}