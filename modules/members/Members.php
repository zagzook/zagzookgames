<?php

class Members extends Trongate
{

    public function make_sure_allowed(string $scenario = 'members area', array $params = [])
    {
        $trongate_user_obj = $this->trongate_tokens->get_user_obj();
        if (!$trongate_user_obj) {
            // User is not logged in, so deny access
            redirect('members-login'); // child module login page
        }
    }
}
