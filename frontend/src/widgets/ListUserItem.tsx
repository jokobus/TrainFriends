import {
  ListItem,
  ListItemAvatar,
  ListItemProps,
  ListItemText,
} from "@mui/material";
import { LinkWidget } from "./LinkWidget";

export const ListUserItem = ({
  userName,
  ...props
}: ListItemProps & {
  userName: string;
}) => {
  return (
    <ListItem key={userName} {...props}>
      <LinkWidget to={"/user/" + userName}>
        <ListItemText primary={userName} sx={{ fontWeight: "bold" }} />
      </LinkWidget>
    </ListItem>
  );
};
