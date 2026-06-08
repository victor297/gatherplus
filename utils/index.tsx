export function truncateSentence(sentence, limit = 9) {
  const words = sentence?.split(" ");
  if (words?.length <= limit) return sentence;
  return words?.slice(0, limit)?.join(" ") + "...";
}

export function truncateAlphabet(sentence, limit = 15) {
  if (!sentence || sentence.length <= limit) return sentence;
  return sentence.slice(0, limit) + "...";
}
export function formatDate(input, timeZone = "Africa/Lagos", locale = "en-US") {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long", // Friday
    year: "numeric", // 2025
    month: "long", // July
    day: "2-digit", // 11
    hour: "numeric", // 12
    minute: "2-digit", // 43
    second: "2-digit", // 41
    hour12: true,
    timeZone,
  };

  return new Intl.DateTimeFormat(locale, options).format(new Date(input));
}
