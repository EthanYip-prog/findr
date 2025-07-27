function getItems(num) {
  console.log("getItems called with num:", num);

  var request = new XMLHttpRequest();

  request.open(
    "GET",
    "https://3mn1pumk79.execute-api.us-east-1.amazonaws.com/api/items",
    true
  );

  request.onload = function () {
    console.log("Status:", request.status);
    console.log("Response text:", request.responseText);

    if (request.status !== 200) {
      console.error("Failed to fetch items. Status:", request.status);
      document.getElementById("items-list").innerHTML =
        "<p>Error loading items.</p>";
      return;
    }

    try {
      var jsonResponse = JSON.parse(request.responseText);
      console.log("Parsed response:", jsonResponse);

      var items = jsonResponse.items || [];
      console.log("Items array:", items);
      console.log("Items length:", items.length);

      if (items.length === 0) {
        document.getElementById("items-list").innerHTML =
          "<p>No items found.</p>";
        return;
      }

      var html = "";
      var max = Math.min(num, items.length);

      console.log("About to process", max, "items");

      for (var i = 0; i < max; i++) {
        var item = items[i];

        if (!item) continue;

        console.log("Processing item", i, ":", item);

        html +=
          '<div class="item-card" data-item-id="' +
          (item.item_id || i) +
          '" onclick="viewItemDetails(' +
          (item.item_id || i) +
          ')" style="cursor: pointer;">';

        // Image section
        html += '<div class="item-image">';
        if (item.image_url) {
          var imageUrl =
            "https://c24b022bucket.s3.amazonaws.com/images/" + item.image_url;
          console.log("Trying image URL:", imageUrl);
          html +=
            '<img src="' +
            imageUrl +
            '" alt="Item image" onload="console.log(\'Image loaded successfully:\', this.src);" onerror="console.error(\'Failed to load image:\', this.src);">';
        } else {
          html += '<div class="placeholder-image"><span>📷</span></div>';
        }
        html += "</div>";

        // Item info section
        html += '<div class="item-info">';
        html +=
          '<h3 class="item-name">' +
          (item.item_name || "Unknown Item") +
          "</h3>";
        html +=
          '<p class="item-status"><strong>Status:</strong> ' +
          (item.item_status || "Unknown Status") +
          "</p>";
        html +=
          '<p class="item-category"><strong>Category:</strong> ' +
          (item.category || "No category") +
          "</p>";
        html +=
          '<p class="item-description"><strong>Description:</strong> ' +
          (item.description || "No description available") +
          "</p>";
        html +=
          '<p class="item-id"><strong>ID:</strong> ' +
          (item.item_id || i) +
          "</p>";
        html += "</div>";

        html += '<div class="item-actions">';
        html +=
          '<button class="action-btn edit-btn" onclick="event.stopPropagation(); editItem(' +
          (item.item_id || i) +
          ')" title="Edit Item">Update</button>';
        html +=
          '<button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteItem(' +
          (item.item_id || i) +
          ')" title="Delete Item">Delete</button>';
        html += "</div>";

        html += "</div>";
      }

      console.log("Generated HTML:", html);
      document.getElementById("items-list").innerHTML = html;
      console.log("HTML inserted into DOM");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      document.getElementById("items-list").innerHTML =
        "<p>Error parsing data.</p>";
    }
  };

  request.onerror = function () {
    console.error("Request failed");
    document.getElementById("items-list").innerHTML = "<p>Network error.</p>";
  };

  request.send();
}

function addItem() {
  console.log("addItem function called");

  var getRequest = new XMLHttpRequest();

  getRequest.open(
    "GET",
    "https://3mn1pumk79.execute-api.us-east-1.amazonaws.com/api/items",
    true
  );

  getRequest.onload = function () {
    console.log("GET request completed. Status:", getRequest.status);
    console.log("GET response:", getRequest.responseText);

    if (getRequest.status !== 200) {
      console.error("Failed to get existing items. Status:", getRequest.status);
      alert("Error checking existing items. Status: " + getRequest.status);
      return;
    }

    try {
      var existingResponse = JSON.parse(getRequest.responseText);
      console.log("Parsed existing response:", existingResponse);

      var existingItems = existingResponse.items || [];
      console.log("Existing items:", existingItems);
      console.log("Number of existing items:", existingItems.length);

      // Find the highest item_id
      var highestId = 0;
      for (var i = 0; i < existingItems.length; i++) {
        var currentId = parseInt(existingItems[i].item_id) || 0;
        console.log(
          "Item",
          i,
          "ID:",
          existingItems[i].item_id,
          "parsed as:",
          currentId
        );
        if (currentId > highestId) {
          highestId = currentId;
        }
      }

      console.log("Highest existing ID:", highestId);
      console.log("New item will have ID:", highestId + 1);

      // Get form data - check each field individually
      var itemName = document.getElementById("item_name");
      var category = document.getElementById("Category");
      var description = document.getElementById("description");
      var imageUrl = document.getElementById("image_url");
      var itemStatus = document.getElementById("item-status");

      console.log("Form elements found:");
      console.log("- item_name:", itemName ? itemName.value : "NOT FOUND");
      console.log("- Category:", category ? category.value : "NOT FOUND");
      console.log(
        "- description:",
        description ? description.value : "NOT FOUND"
      );
      console.log("- image_url:", imageUrl ? imageUrl.value : "NOT FOUND");
      console.log(
        "- item-status:",
        itemStatus ? itemStatus.value : "NOT FOUND"
      );

      if (!itemName || !category || !description || !imageUrl || !itemStatus) {
        alert(
          "One or more form fields not found! Check the console for details."
        );
        return;
      }

      var jsonData = {
        item_id: highestId + 1,
        item_name: itemName.value,
        category: category.value,
        description: description.value,
        image_url: imageUrl.value,
        item_status: itemStatus.value,
      };

      console.log("Form data collected:", jsonData);

      // Validation
      if (
        !jsonData.item_name ||
        !jsonData.category ||
        !jsonData.description ||
        !jsonData.image_url ||
        !jsonData.item_status
      ) {
        alert("All fields are required!");
        return;
      }

      console.log("Sending item data with ID:", jsonData.item_id);

      var postRequest = new XMLHttpRequest();

      postRequest.open(
        "POST",
        "https://3mn1pumk79.execute-api.us-east-1.amazonaws.com/api/items",
        true
      );

      postRequest.setRequestHeader("Content-Type", "application/json");

      postRequest.onload = function () {
        console.log("POST Status:", postRequest.status);
        console.log("POST Response:", postRequest.responseText);

        if (postRequest.status === 200 || postRequest.status === 201) {
          alert("Item added successfully with ID: " + jsonData.item_id);

          // Clear the form
          var form = document.getElementById("add-item-form");
          if (form) form.reset();

          // Redirect back to main page
          window.location.href = "main_page.html";
        } else {
          alert("Error adding item. Status: " + postRequest.status);
          console.error("Error response:", postRequest.responseText);
        }
      };

      postRequest.onerror = function () {
        console.error("POST request failed");
        alert("Network error. Please check your connection.");
      };

      postRequest.send(JSON.stringify(jsonData));
    } catch (error) {
      console.error("Error processing existing items:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      alert("Error processing existing items: " + error.message);
    }
  };

  getRequest.onerror = function () {
    console.error("GET request failed");
    alert("Network error while checking existing items");
  };

  getRequest.send();
}

// Initialize event listeners when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, checking for form...");

  // Check if we're on the add items page
  var addForm = document.getElementById("add-item-form");
  if (addForm) {
    console.log("Found add-item-form, attaching event listener");

    // Set up image file input handler for add page
    var imageFileInput = document.getElementById("image_file");
    if (imageFileInput) {
      imageFileInput.addEventListener("change", function (event) {
        handleImageSelection(event);
      });
    }

    addForm.addEventListener("submit", function (event) {
      console.log("Add form submitted!");
      event.preventDefault(); // Prevent normal form submission
      addItem(); // Call our custom function
    });
  }

  // Check if we're on the edit items page
  var editForm = document.getElementById("edit-item-form");
  if (editForm) {
    console.log("Found edit-item-form, setting up edit page");

    // Load item data for editing
    loadItemForEdit();

    // Set up image file input handler for edit page
    var editImageFileInput = document.getElementById("edit_image_file");
    if (editImageFileInput) {
      editImageFileInput.addEventListener("change", function (event) {
        handleEditImageSelection(event);
      });
    }

    editForm.addEventListener("submit", function (event) {
      console.log("Edit form submitted!");
      event.preventDefault(); // Prevent normal form submission
      updateItem(); // Call our custom function
    });
  }

  // Check if we're on the main page and call getItems
  var itemsList = document.getElementById("items-list");
  if (itemsList) {
    console.log("Found items-list, calling getItems...");
    getItems(10);

    // Set up search functionality
    var searchInput = document.getElementById("search-input");
    if (searchInput) {
      console.log("Found search input, setting up search functionality");

      // Search on Enter key press
      searchInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
          var query = searchInput.value.trim();
          console.log("Search triggered with query:", query);
          searchItems(query);
        }
      });

      // Optional: Search as user types (with debounce)
      var searchTimeout;
      searchInput.addEventListener("input", function (event) {
        clearTimeout(searchTimeout);
        var query = event.target.value.trim();

        // Debounce search - wait 500ms after user stops typing
        searchTimeout = setTimeout(function () {
          console.log("Auto-search triggered with query:", query);
          searchItems(query);
        }, 500);
      });
    }
  }
});

// Handle image file selection and preview
function handleImageSelection(event) {
  var file = event.target.files[0];
  if (file) {
    console.log(
      "File selected:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Show image preview
    var reader = new FileReader();
    reader.onload = function (e) {
      var previewDiv = document.getElementById("image-preview");
      var previewImg = document.getElementById("preview-img");

      previewImg.src = e.target.result;
      previewDiv.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Upload image to S3
    uploadImageToS3(file);
  }
}

// Upload image to S3 bucket
function uploadImageToS3(file) {
  console.log("Starting S3 upload for:", file.name);

  // Generate unique filename
  var timestamp = new Date().getTime();
  var fileName = timestamp + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, "");

  // Show upload progress
  var uploadStatus = document.createElement("div");
  uploadStatus.id = "upload-status";
  uploadStatus.innerHTML = '<p style="color: #007bff;">Uploading image...</p>';
  document.getElementById("image-preview").appendChild(uploadStatus);

  // Convert file to base64
  var reader = new FileReader();
  reader.onload = function (e) {
    // Get base64 data without the data:image/jpeg;base64, prefix
    var base64Data = e.target.result.split(",")[1];

    // Prepare the request body for your Lambda function
    var requestBody = {
      base64Image: base64Data,
      fileName: fileName,
      folder: "images", // This will put images in the 'images' folder
    };

    // Upload to your Lambda function endpoint
    var uploadRequest = new XMLHttpRequest();

    // Replace with your actual API Gateway endpoint for the upload Lambda
    uploadRequest.open(
      "POST",
      "https://g19duilfpd.execute-api.us-east-1.amazonaws.com/api/upload-image",
      true
    );
    uploadRequest.setRequestHeader("Content-Type", "application/json");

    uploadRequest.onload = function () {
      var statusDiv = document.getElementById("upload-status");

      if (uploadRequest.status === 200) {
        try {
          var response = JSON.parse(uploadRequest.responseText);
          console.log("Upload successful:", response);

          // Set the image URL in the hidden field (just the filename)
          document.getElementById("image_url").value = fileName;

          // Update status
          if (statusDiv) {
            statusDiv.innerHTML =
              '<p style="color: #28a745;">Image uploaded successfully!</p>';
            setTimeout(() => statusDiv.remove(), 3000);
          }
        } catch (error) {
          console.error("Error parsing upload response:", error);
          if (statusDiv) {
            statusDiv.innerHTML =
              '<p style="color: #dc3545;">Upload failed - Invalid response</p>';
          }
        }
      } else {
        console.error("Upload failed with status:", uploadRequest.status);
        console.error("Response:", uploadRequest.responseText);
        if (statusDiv) {
          statusDiv.innerHTML =
            '<p style="color: #dc3545;">Upload failed - Server error</p>';
        }
      }
    };

    uploadRequest.onerror = function () {
      console.error("Upload request failed");
      var statusDiv = document.getElementById("upload-status");
      if (statusDiv) {
        statusDiv.innerHTML =
          '<p style="color: #dc3545;">Upload failed - Network error</p>';
      }
    };

    uploadRequest.send(JSON.stringify(requestBody));
  };

  reader.onerror = function () {
    var statusDiv = document.getElementById("upload-status");
    if (statusDiv) {
      statusDiv.innerHTML =
        '<p style="color: #dc3545;">Failed to read file</p>';
    }
  };

  // Read file as data URL (base64)
  reader.readAsDataURL(file);
}

function editItem(itemId) {
  console.log("Redirecting to edit page for item:", itemId);
  window.location.href = "edit_items_page.html?id=" + itemId;
}

// View item details function
function viewItemDetails(itemId) {
  console.log("Redirecting to item details page for item:", itemId);
  window.location.href = "item_details_page.html?id=" + itemId;
}

// Load item data for editing
function loadItemForEdit() {
  // Get item ID from URL parameters
  var urlParams = new URLSearchParams(window.location.search);
  var itemId = urlParams.get("id");

  if (!itemId) {
    alert("No item ID provided!");
    window.location.href = "main_page.html";
    return;
  }

  console.log("Loading item for edit, ID:", itemId);

  // Fetch all items and find the one to edit
  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "https://3mn1pumk79.execute-api.us-east-1.amazonaws.com/api/items",
    true
  );

  request.onload = function () {
    if (request.status === 200) {
      try {
        var response = JSON.parse(request.responseText);
        var items = response.items || [];

        // Find the item with matching ID
        var itemToEdit = items.find(function (item) {
          return item.item_id == itemId;
        });

        if (itemToEdit) {
          populateEditForm(itemToEdit);
        } else {
          alert("Item not found!");
          window.location.href = "main_page.html";
        }
      } catch (error) {
        console.error("Error parsing response:", error);
        alert("Error loading item data");
      }
    } else {
      console.error("Failed to load items");
      alert("Error loading item data");
    }
  };

  request.onerror = function () {
    console.error("Request failed");
    alert("Network error loading item data");
  };

  request.send();
}

// Populate the edit form with item data
function populateEditForm(item) {
  console.log("Populating edit form with:", item);

  // Fill in the form fields
  document.getElementById("edit_item_name").value = item.item_name || "";
  document.getElementById("edit_description").value = item.description || "";
  document.getElementById("edit_item_status").value =
    item.item_status || "unclaimed";
  document.getElementById("edit_Category").value = item.category || "Others";
  document.getElementById("edit_image_url").value = item.image_url || "";

  // Show current image if it exists
  if (item.image_url) {
    var previewDiv = document.getElementById("edit-image-preview");
    var previewImg = document.getElementById("edit-preview-img");
    var imageUrl =
      "https://c24b022bucket.s3.amazonaws.com/images/" + item.image_url;

    previewImg.src = imageUrl;
    previewDiv.style.display = "block";
  }

  // Store the item ID for updating
  window.currentEditItemId = item.item_id;
}

// Handle image selection for edit page
function handleEditImageSelection(event) {
  var file = event.target.files[0];
  if (file) {
    console.log(
      "Edit image selected:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Show image preview
    var reader = new FileReader();
    reader.onload = function (e) {
      var previewDiv = document.getElementById("edit-image-preview");
      var previewImg = document.getElementById("edit-preview-img");

      previewImg.src = e.target.result;
      previewDiv.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Upload new image to S3
    uploadEditImageToS3(file);
  }
}

// Upload image for edit page
function uploadEditImageToS3(file) {
  console.log("Starting S3 upload for edit image:", file.name);

  // Generate unique filename
  var timestamp = new Date().getTime();
  var fileName = timestamp + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, "");

  // Show upload progress
  var uploadStatus = document.createElement("div");
  uploadStatus.id = "edit-upload-status";
  uploadStatus.innerHTML =
    '<p style="color: #007bff;">Uploading new image...</p>';
  document.getElementById("edit-image-preview").appendChild(uploadStatus);

  // Convert file to base64
  var reader = new FileReader();
  reader.onload = function (e) {
    var base64Data = e.target.result.split(",")[1];

    var requestBody = {
      base64Image: base64Data,
      fileName: fileName,
      folder: "images",
    };

    var uploadRequest = new XMLHttpRequest();
    uploadRequest.open(
      "POST",
      "https://g19duilfpd.execute-api.us-east-1.amazonaws.com/api/upload-image",
      true
    );
    uploadRequest.setRequestHeader("Content-Type", "application/json");

    uploadRequest.onload = function () {
      var statusDiv = document.getElementById("edit-upload-status");

      if (uploadRequest.status === 200) {
        try {
          var response = JSON.parse(uploadRequest.responseText);
          console.log("Edit image upload successful:", response);

          // Update the hidden field with new filename
          document.getElementById("edit_image_url").value = fileName;

          if (statusDiv) {
            statusDiv.innerHTML =
              '<p style="color: #28a745;">New image uploaded successfully!</p>';
            setTimeout(() => statusDiv.remove(), 3000);
          }
        } catch (error) {
          console.error("Error parsing upload response:", error);
          if (statusDiv) {
            statusDiv.innerHTML =
              '<p style="color: #dc3545;">Upload failed - Invalid response</p>';
          }
        }
      } else {
        console.error("Upload failed with status:", uploadRequest.status);
        if (statusDiv) {
          statusDiv.innerHTML =
            '<p style="color: #dc3545;">Upload failed - Server error</p>';
        }
      }
    };

    uploadRequest.onerror = function () {
      console.error("Upload request failed");
      var statusDiv = document.getElementById("edit-upload-status");
      if (statusDiv) {
        statusDiv.innerHTML =
          '<p style="color: #dc3545;">Upload failed - Network error</p>';
      }
    };

    uploadRequest.send(JSON.stringify(requestBody));
  };

  reader.readAsDataURL(file);
}

// Update item function - Only updates item status
function updateItem() {
  console.log("updateItem function called");

  if (!window.currentEditItemId) {
    alert("No item ID found for updating!");
    return;
  }

  // Get only the item status
  var itemStatus = document.getElementById("edit_item_status").value;

  // Validation - only check item status
  if (!itemStatus) {
    alert("Item status is required!");
    return;
  }

  // Prepare update data - only item_id and item_status
  var updateData = {
    item_id: parseInt(window.currentEditItemId),
    item_status: itemStatus,
  };

  console.log("Sending update data:", updateData);

  // Send PUT request to update item
  var updateRequest = new XMLHttpRequest();
  updateRequest.open(
    "PUT",
    "https://3mn1pumk79.execute-api.us-east-1.amazonaws.com/api/items",
    true
  );
  updateRequest.setRequestHeader("Content-Type", "application/json");

  updateRequest.onload = function () {
    console.log("UPDATE Status:", updateRequest.status);
    console.log("UPDATE Response:", updateRequest.responseText);

    if (updateRequest.status === 200) {
      alert("Item status updated successfully!");
      window.location.href = "main_page.html";
    } else {
      alert("Error updating item status. Status: " + updateRequest.status);
      console.error("Update failed:", updateRequest.responseText);
    }
  };

  updateRequest.onerror = function () {
    console.error("UPDATE request failed");
    alert("Network error while updating item status.");
  };

  updateRequest.send(JSON.stringify(updateData));
}

function deleteItem(itemId) {
  if (confirm("Are you sure you want to delete this item?")) {
    console.log("Attempting to delete item:", itemId);

    var deleteRequest = new XMLHttpRequest();

    deleteRequest.open(
      "DELETE",
      "https://3mn1pumk79.execute-api.us-east-1.amazonaws.com/api/items/" +
        itemId,
      true
    );

    deleteRequest.onload = function () {
      console.log("Delete request status:", deleteRequest.status);
      console.log("Delete response:", deleteRequest.responseText);

      if (deleteRequest.status === 200 || deleteRequest.status === 204) {
        alert("Item deleted successfully!");
        // Refresh the items list to show updated data
        getItems(10);
      } else {
        alert("Error deleting item. Status: " + deleteRequest.status);
        console.error("Delete failed:", deleteRequest.responseText);
      }
    };

    deleteRequest.onerror = function () {
      console.error("DELETE request failed");
      alert("Network error while deleting item.");
    };

    deleteRequest.send();
  }
}

// Search function for OpenSearch
function searchItems(query) {
  console.log("searchItems called with query:", query);

  if (!query || query.trim().length === 0) {
    // If search is empty, show all items
    getItems(10);
    return;
  }

  var request = new XMLHttpRequest();
  var searchUrl =
    "https://3mn1pumk79.execute-api.us-east-1.amazonaws.com/api/items/search?query=" +
    encodeURIComponent(query.trim());

  request.open("GET", searchUrl, true);

  request.onload = function () {
    console.log("Search Status:", request.status);
    console.log("Search Response text:", request.responseText);

    if (request.status !== 200) {
      console.error("Failed to search items. Status:", request.status);
      document.getElementById("items-list").innerHTML =
        "<p>Error searching items.</p>";
      return;
    }

    try {
      var searchResults = JSON.parse(request.responseText);
      console.log("Search results:", searchResults);

      if (!searchResults || searchResults.length === 0) {
        document.getElementById("items-list").innerHTML =
          "<p>No items found matching your search.</p>";
        return;
      }

      // Display search results using the same format as getItems
      displaySearchResults(searchResults);
    } catch (error) {
      console.error("Error parsing search JSON:", error);
      document.getElementById("items-list").innerHTML =
        "<p>Error parsing search results.</p>";
    }
  };

  request.onerror = function () {
    console.error("Search request failed");
    document.getElementById("items-list").innerHTML =
      "<p>Network error during search.</p>";
  };

  request.send();
}

// Display search results in the same format as regular items
function displaySearchResults(items) {
  console.log("Displaying search results:", items);

  var html = "";

  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    if (!item) continue;

    console.log("Processing search result item", i, ":", item);

    html +=
      '<div class="item-card" data-item-id="' +
      (item.item_id || i) +
      '" onclick="viewItemDetails(' +
      (item.item_id || i) +
      ')" style="cursor: pointer;">';

    // Image section
    html += '<div class="item-image">';
    if (item.image_url) {
      var imageUrl =
        "https://c24b022bucket.s3.amazonaws.com/images/" + item.image_url;
      console.log("Trying image URL:", imageUrl);
      html +=
        '<img src="' +
        imageUrl +
        '" alt="Item image" onload="console.log(\'Image loaded successfully:\', this.src);" onerror="console.error(\'Failed to load image:\', this.src);">';
    } else {
      html += '<div class="placeholder-image"><span>📷</span></div>';
    }
    html += "</div>";

    // Item info section
    html += '<div class="item-info">';
    html +=
      '<h3 class="item-name">' + (item.item_name || "Unknown Item") + "</h3>";
    html +=
      '<p class="item-status"><strong>Status:</strong> ' +
      (item.item_status || "Unknown Status") +
      "</p>";
    html +=
      '<p class="item-category"><strong>Category:</strong> ' +
      (item.category || "No category") +
      "</p>";
    html +=
      '<p class="item-description"><strong>Description:</strong> ' +
      (item.description || "No description available") +
      "</p>";
    html +=
      '<p class="item-id"><strong>ID:</strong> ' + (item.item_id || i) + "</p>";
    html += "</div>";

    html += '<div class="item-actions">';
    html +=
      '<button class="action-btn edit-btn" onclick="event.stopPropagation(); editItem(' +
      (item.item_id || i) +
      ')" title="Edit Item">Update</button>';
    html +=
      '<button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteItem(' +
      (item.item_id || i) +
      ')" title="Delete Item">Delete</button>';
    html += "</div>";

    html += "</div>";
  }

  console.log("Generated search HTML:", html);
  document.getElementById("items-list").innerHTML = html;
  console.log("Search HTML inserted into DOM");
}
