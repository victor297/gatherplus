export function formatDate(dateString?: string|Date): string {
    try {
      if (!dateString) {
        return "No date provided";
      }
  
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
  
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Error formatting date";
    }
  }