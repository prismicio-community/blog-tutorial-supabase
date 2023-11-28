import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(req) {
  const formData = await req.formData();
  const payload = await formData.get("payload");

  const { response_url, actions, user } = JSON.parse(payload);

  let res = "";

  console.log(formData);

  if (actions[0].action_id === "approve_comment") {
    res = await approveComment(user.id, actions[0].value);
  } else if (actions[0].action_id === "delete_comment") {
    res = await deleteComment(user.id, actions[0].value);
  }

  await respondToSlack(response_url, res, actions[0].action_id);

  return new NextResponse(null, {
    status: 200,
  });
}

// Delete comment from Supabase
const deleteComment = async (userID, id) => {
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    return `Error deleting comment (${id})!`;
  } else {
    return `Comment (${id}) deleted by *<@${userID}>*!`;
  }
};

// Approve comment in Supabase
const approveComment = async (userID, id) => {
  const { error } = await supabase
    .from("comments")
    .update({ published: true })
    .eq("id", id);

  if (error) {
    return `Error approving comment (${id})!`;
  } else {
    return `Comment (<https://supabase.com/dashboard/project/kmimxhcpximbajtshrve/editor/28564|${id}>) approved by *<@${userID}>*!`;
  }
};

// Respond to Slack with a message
const respondToSlack = async (responseURL, text, type) => {
  await fetch(responseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${
              type === "approve_comment" ? "Approvement" : "Deletion"
            } succesful! ${
              type === "approve_comment"
                ? ":white_check_mark:"
                : ":octagonal_sign:"
            }`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: text,
          },
        },
      ],
      response_type: "in_channel",
    }),
  });
};
