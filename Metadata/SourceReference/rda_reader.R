args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 1) {
  stop("Usage: Rscript rda_reader.R <file.Rda> [--metadata]", call. = FALSE)
}

path <- args[[1]]
metadata_mode <- "--metadata" %in% args

json_escape <- function(x) {
  x <- gsub("\\\\", "\\\\\\\\", x)
  x <- gsub("\"", "\\\\\"", x)
  x <- gsub("\n", "\\\\n", x)
  x <- gsub("\r", "\\\\r", x)
  x <- gsub("\t", "\\\\t", x)
  x
}

json_value <- function(x) {
  if (length(x) == 0 || is.na(x)) {
    return("null")
  }
  if (is.numeric(x) || is.integer(x)) {
    if (is.finite(x)) return(as.character(x))
    return("null")
  }
  if (is.logical(x)) {
    if (is.na(x)) return("null")
    return(ifelse(x, "true", "false"))
  }
  paste0("\"", json_escape(as.character(x)), "\"")
}

json_array <- function(x) {
  paste0("[", paste(vapply(x, json_value, character(1)), collapse = ","), "]")
}

field <- function(a, name) {
  if (is.list(a) && !is.null(a[[name]]) && length(a[[name]]) > 0) {
    return(as.character(a[[name]][[1]]))
  }
  NA_character_
}

env <- new.env(parent = emptyenv())
loaded <- load(path, envir = env)

if (metadata_mode) {
  listing <- env[[loaded[[1]]]]
  attrs <- listing$attributes
  entries <- character()
  for (i in seq_along(attrs)) {
    a <- attrs[[i]]
    table <- field(a, "TABLE")
    name <- field(a, "NAME")
    if (is.na(table) || is.na(name)) next
    key <- paste0(table, "/", name)
    entries <- c(entries, paste0(
      json_value(key), ":{",
      "\"table\":", json_value(table), ",",
      "\"name\":", json_value(name), ",",
      "\"type\":", json_value(field(a, "TYPE")), ",",
      "\"units\":", json_value(field(a, "UNITS")), ",",
      "\"description\":", json_value(field(a, "DESCRIPTION")), ",",
      "\"module\":", json_value(field(a, "MODULE")),
      "}"
    ))
  }
  cat(paste0("{", paste(entries, collapse = ","), "}"))
  quit(status = 0)
}

name <- loaded[[1]]
x <- env[[name]]
if (is.factor(x)) x <- as.character(x)
if (is.list(x) && !is.data.frame(x)) {
  cat(paste0("{\"object\":", json_value(name), ",\"class\":", json_value(paste(class(x), collapse = ",")), ",\"length\":", length(x), ",\"values\":[]}"))
} else {
  values <- as.vector(x)
  cat(paste0(
    "{",
    "\"object\":", json_value(name), ",",
    "\"class\":", json_value(paste(class(x), collapse = ",")), ",",
    "\"type\":", json_value(typeof(x)), ",",
    "\"length\":", length(values), ",",
    "\"values\":", json_array(values),
    "}"
  ))
}
