import { ListItem, ListItemProps, ListItemText } from "@mui/material";
import { LinkWidget } from "./LinkWidget";

export const ListUserItem = ({
  userName,
  ...props
}: ListItemProps & {
  userName: string;
}) => {
  return (
    <ListItem key={userName} {...props}>
      <ListItemText primary={userName} sx={{ fontWeight: "bold" }} />
    </ListItem>
  );
};
