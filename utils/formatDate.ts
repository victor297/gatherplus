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

  export function formatTime(dateString?: string | Date): string {
    try {
      if (!dateString) {
        return "No date provided";
      }
  
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
  
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true, // Change to false for 24-hour format
      });
    } catch (error) {
      return "Error formatting time";
    }
  }
  